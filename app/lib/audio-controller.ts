import { AudioChunk, AudioConfig, SpeechChunk } from "./types";
import { processFullPipeline } from "./actions/audio-processing";

/**
 * AudioController manages a simplified 2-stage pipeline:
 * 1. Audio → Text → AI Enhancement → Speech (all processing)
 * 2. Speech → Playback
 */
export class AudioController {
    private config: AudioConfig;
    private mediaRecorder: MediaRecorder | null = null;
    private mediaStream: MediaStream | null = null;
    private recordingTimer: NodeJS.Timeout | null = null;

    // Buffers ready to play
    public speechChunksBuffer: SpeechChunk[] = [];

    private isRecording: boolean = false;

    // Accumulated text for UI display
    private fullTranscript: string = ""; // Original raw transcription
    private fullScript: string = ""; // Enhanced/improved version

    // Processing intervals for each stage
    private speechInterval: NodeJS.Timeout | null = null; // Speech → Playback

    // Queue for sequential processing (prevents rate limiting)
    private audioProcessingQueue: AudioChunk[] = [];
    private isProcessing: boolean = false;

    constructor(config: AudioConfig) {
        this.config = config;
    }

    public getIsRecording(): boolean {
        return this.isRecording;
    }

    public getFullTranscript(): string {
        return this.fullTranscript;
    }

    public getFullScript(): string {
        return this.fullScript;
    }

    private async setupMicrophone(): Promise<MediaStream> {
        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
        } catch (error) {
            console.error("Error setting up microphone:", error);
            throw error;
        }
    }

    async startRecording(): Promise<void> {
        if (this.isRecording) return;

        this.isRecording = true;

        // Clear previous session data
        this.fullTranscript = "";
        this.fullScript = "";

        try {
            // Request access to the microphone
            this.mediaStream = await this.setupMicrophone();

            // Start the recording loop
            this.recordNextChunk();

            // Start both processing stages
            this.startSpeechProcessing(); // Speech → Playback
        } catch (error) {
            this.isRecording = false;
            console.error("Failed to start recording:", error);
            throw error;
        }
    }

    private recordNextChunk(): void {
        if (!this.isRecording || !this.mediaStream) return;

        // Create a new MediaRecorder instance with explicit mimeType
        // Using audio/webm;codecs=opus for better compatibility
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm";

        const recorder = new MediaRecorder(this.mediaStream, {
            mimeType: mimeType,
        });
        this.mediaRecorder = recorder;

        const chunkData: Blob[] = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunkData.push(e.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunkData, { type: mimeType });

            if (blob.size > 0) {
                const chunk: AudioChunk = {
                    id: Date.now().toString(),
                    audioData: blob,
                    timestamp: Date.now(),
                    duration: this.config.chunkDurationMs,
                    status: "pending",
                };
                this.audioProcessingQueue.push(chunk);
                this.processQueue(); // Start processing if not already running
            }

            // Recursively record the next chunk if we are still recording
            if (this.isRecording) {
                this.recordNextChunk();
            }
        };

        // Start recording
        // Note: We do NOT use timeslice here. We record a full segment then stop.
        // This ensures every chunk has a valid file header.
        recorder.start();

        // Schedule the stop
        this.recordingTimer = setTimeout(() => {
            if (recorder.state === "recording") {
                recorder.stop();
            }
        }, this.config.chunkDurationMs);
    }

    async stopRecording(): Promise<void> {
        this.isRecording = false;

        // Clear the timer to prevent next chunk
        if (this.recordingTimer) {
            clearTimeout(this.recordingTimer);
            this.recordingTimer = null;
        }

        // Stop current recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
            this.mediaRecorder.stop();
        }
        this.mediaRecorder = null;

        // Stop microphone tracks
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
            this.mediaStream = null;
        }

        if (this.speechInterval) {
            clearInterval(this.speechInterval);
            this.speechInterval = null;
        }

        // Clear all buffers
        this.speechChunksBuffer = [];
        this.audioProcessingQueue = [];
        this.isProcessing = false;
    }

    private async processQueue(): Promise<void> {
        // If already processing or queue is empty, return
        if (this.isProcessing || this.audioProcessingQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.audioProcessingQueue.length > 0) {
            const chunk = this.audioProcessingQueue.shift()!;
            await this.processStage1(chunk);
        }

        this.isProcessing = false;
    }

    public async processStage1(chunk: AudioChunk): Promise<void> {
        try {
            chunk.status = "transcribing";

            // Create FormData with audio blob
            const formData = new FormData();
            formData.append("audio", chunk.audioData);

            // Call server action for full pipeline: Audio → Text → Script → Speech
            const result = await processFullPipeline(formData);

            if (!result.success) {
                throw new Error(result.error);
            }

            // If the audio is empty, don't process it
            if (result.skipped || !result.audioBase64) {
                return;
            }

            // Update accumulated text for UI
            this.fullTranscript +=
                (this.fullTranscript ? " " : "") + result.originalText;
            this.fullScript +=
                (this.fullScript ? " " : "") + result.enhancedText;

            // Convert base64 audio back to Blob
            const audioBytes = Uint8Array.from(atob(result.audioBase64), (c) =>
                c.charCodeAt(0)
            );
            const audioBlob = new Blob([audioBytes], { type: "audio/mp3" });

            // Push to playback buffer
            this.speechChunksBuffer.push({
                id: chunk.id,
                speechData: audioBlob,
                timestamp: chunk.timestamp,
                duration: 0,
                status: "pending",
            });

            console.log(`✓ Stage 1 complete: Ready for playback`);
        } catch (error) {
            chunk.status = "error";
            console.error(
                "Error in Stage 1 (Audio→Text→Script→Speech):",
                error
            );
        }
    }

    private audioContext: AudioContext | null = null;

    private startSpeechProcessing(): void {
        this.speechInterval = setInterval(async () => {
            if (this.speechChunksBuffer.length === 0) return;

            const chunk = this.speechChunksBuffer.shift()!;
            await this.playSpeech(chunk);
        }, 100);
    }

    private async playSpeech(chunk: SpeechChunk): Promise<void> {
        try {
            chunk.status = "complete";

            // Initialize audio context if needed
            if (!this.audioContext) {
                this.audioContext = new AudioContext();
            }

            // Convert Blob to AudioBuffer
            const arrayBuffer = await chunk.speechData.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(
                arrayBuffer
            );

            // Play the audio
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.start();

            console.log(`✓ Speech complete: Playing audio chunk ${chunk.id}`);
        } catch (error) {
            chunk.status = "error";
            console.error("Error in Speech (Playback):", error);
        }
    }
}
