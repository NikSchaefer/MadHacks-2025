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

    // Buffers ready to play
    private speechChunksBuffer: SpeechChunk[] = [];

    private isRecording: boolean = false;

    // Accumulated text for UI display
    private fullTranscript: string = ""; // Original raw transcription
    private fullScript: string = ""; // Enhanced/improved version

    // Processing intervals for each stage
    private stage2Interval: NodeJS.Timeout | null = null; // Speech → Playback

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
        this.isRecording = true;

        // Clear previous session data
        this.fullTranscript = "";
        this.fullScript = "";

        // Request access to the microphone
        const mediaStream = await this.setupMicrophone();

        // Create a new MediaRecorder instance
        this.mediaRecorder = new MediaRecorder(mediaStream);

        // When audio data is available, process it
        this.mediaRecorder.ondataavailable = (e) => {
            this.processStage1({
                id: Date.now().toString(),
                audioData: e.data,
                timestamp: Date.now(),
                duration: this.config.chunkDurationMs,
                status: "pending",
            });
        };

        // Start recording and emit chunks periodically
        this.mediaRecorder.start();
        setInterval(() => {
            if (this.mediaRecorder?.state === "recording") {
                this.mediaRecorder.requestData();
            }
        }, this.config.chunkDurationMs);

        // Start both processing stages
        this.startStage2Processing(); // Speech → Playback
    }

    async stopRecording(): Promise<void> {
        this.isRecording = false;

        // Stop microphone recording
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream
                .getTracks()
                .forEach((track) => track.stop());
            this.mediaRecorder = null;
        }

        if (this.stage2Interval) {
            clearInterval(this.stage2Interval);
            this.stage2Interval = null;
        }

        // Clear all buffers
        this.speechChunksBuffer = [];
    }

    public async processStage1(chunk: AudioChunk): Promise<void> {
        try {
            chunk.status = "transcribing";

            // Create FormData with audio blob
            const formData = new FormData();
            formData.append("audio", chunk.audioData);

            // Call server action for full pipeline: Audio → Text → Script → Speech
            const result = await processFullPipeline(formData);

            if (
                !result.success ||
                !result.originalText ||
                !result.enhancedText ||
                !result.audioBase64
            ) {
                throw new Error(result.error || "Processing failed");
            }

            // Update accumulated text for UI
            this.fullTranscript +=
                (this.fullTranscript ? " " : "") + result.originalText;
            this.fullScript +=
                (this.fullScript ? " " : "") + result.enhancedText;

            console.log(
                `✓ Transcribed: "${result.originalText.substring(0, 50)}..."`
            );
            console.log(
                `✓ Enhanced: "${result.enhancedText.substring(0, 50)}..."`
            );

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

    // ============ STAGE 2: Speech → Playback ============
    private audioContext: AudioContext | null = null;

    private startStage2Processing(): void {
        this.stage2Interval = setInterval(async () => {
            if (this.speechChunksBuffer.length === 0) return;

            const chunk = this.speechChunksBuffer.shift()!;
            await this.processStage2(chunk);
        }, 100);
    }

    private async processStage2(chunk: SpeechChunk): Promise<void> {
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

            console.log(`✓ Stage 2 complete: Playing audio chunk ${chunk.id}`);
        } catch (error) {
            chunk.status = "error";
            console.error("Error in Stage 2 (Speech→Playback):", error);
        }
    }
}
