import { speechToText } from "./processors/speech-to-text";
import { textToSpeech } from "./processors/text-to-speech";
import { textToScript } from "./processors/text-to-script";
import { AudioChunk, TextSegment, AudioConfig, SpeechChunk } from "./types";

/**
 * AudioController manages a 3-stage pipeline:
 * 1. AudioChunks → TextSegments (speech-to-text)
 * 2. TextSegments → SpeechChunks (text-to-script → text-to-speech)
 * 3. SpeechChunks → Audio Playback
 */
export class AudioController {
    private config: AudioConfig;
    private mediaRecorder: MediaRecorder | null = null;

    // Three separate buffers for each stage
    private audioChunksBuffer: AudioChunk[] = [];
    private textSegmentsBuffer: TextSegment[] = [];
    private speechChunksBuffer: SpeechChunk[] = [];

    private isRecording: boolean = false;

    // Accumulated text for UI display
    private fullTranscript: string = ""; // Original raw transcription
    private fullScript: string = ""; // Enhanced/improved version

    // Processing intervals for each stage
    private stage1Interval: NodeJS.Timeout | null = null;
    private stage2Interval: NodeJS.Timeout | null = null;
    private stage3Interval: NodeJS.Timeout | null = null;

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

    public getBufferCounts() {
        return {
            audioChunks: this.audioChunksBuffer.length,
            textSegments: this.textSegmentsBuffer.length,
            speechChunks: this.speechChunksBuffer.length,
        };
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

        // When audio data is available, add to buffer
        this.mediaRecorder.ondataavailable = (e) => {
            this.audioChunksBuffer.push({
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

        // Start all three processing stages
        this.startStage1Processing(); // Audio → Text
        this.startStage2Processing(); // Text → Enhanced Script → Speech
        this.startStage3Processing(); // Speech → Playback
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

        // Stop all processing intervals
        if (this.stage1Interval) {
            clearInterval(this.stage1Interval);
            this.stage1Interval = null;
        }
        if (this.stage2Interval) {
            clearInterval(this.stage2Interval);
            this.stage2Interval = null;
        }
        if (this.stage3Interval) {
            clearInterval(this.stage3Interval);
            this.stage3Interval = null;
        }

        // Clear all buffers
        this.audioChunksBuffer = [];
        this.textSegmentsBuffer = [];
        this.speechChunksBuffer = [];
    }

    // ============ STAGE 1: Audio → Text ============
    private startStage1Processing(): void {
        this.stage1Interval = setInterval(async () => {
            if (this.audioChunksBuffer.length === 0) return;

            const chunk = this.audioChunksBuffer.shift()!;
            await this.processStage1(chunk);
        }, 100); // Check frequently for new chunks
    }

    private async processStage1(chunk: AudioChunk): Promise<void> {
        try {
            chunk.status = "transcribing";
            const { text } = await speechToText(chunk.audioData);

            // Accumulate to full transcript
            this.fullTranscript += (this.fullTranscript ? " " : "") + text;

            // Push to next stage buffer
            this.textSegmentsBuffer.push({
                id: chunk.id,
                original: text,
                translated: "", // Will be filled in stage 2
                timestamp: chunk.timestamp,
                status: "pending",
            });

            console.log(`✓ Stage 1 complete: "${text.substring(0, 50)}..."`);
        } catch (error) {
            chunk.status = "error";
            console.error("Error in Stage 1 (Audio→Text):", error);
        }
    }

    // ============ STAGE 2: Text → Enhanced Script → Speech ============
    private startStage2Processing(): void {
        this.stage2Interval = setInterval(async () => {
            if (this.textSegmentsBuffer.length === 0) return;

            const segment = this.textSegmentsBuffer.shift()!;
            await this.processStage2(segment);
        }, 100);
    }

    private async processStage2(segment: TextSegment): Promise<void> {
        try {
            // Enhance the text with AI
            segment.status = "translating";
            const enhancedText = await textToScript(segment.original);
            segment.translated = enhancedText;

            // Accumulate to full script
            this.fullScript += (this.fullScript ? " " : "") + enhancedText;

            // Convert enhanced text to speech
            segment.status = "synthesizing";
            const audioBuffer = await textToSpeech(enhancedText);

            // Convert Buffer to Uint8Array for Blob
            const uint8Array = new Uint8Array(audioBuffer);

            // Push to next stage buffer
            this.speechChunksBuffer.push({
                id: segment.id,
                speechData: new Blob([uint8Array], { type: "audio/mp3" }),
                timestamp: segment.timestamp,
                duration: 0, // TODO: estimate from buffer
                status: "pending",
            });

            console.log(
                `✓ Stage 2 complete: "${enhancedText.substring(0, 50)}..."`
            );
        } catch (error) {
            segment.status = "error";
            console.error("Error in Stage 2 (Text→Script→Speech):", error);
        }
    }

    // ============ STAGE 3: Speech → Playback ============
    private audioContext: AudioContext | null = null;

    private startStage3Processing(): void {
        this.stage3Interval = setInterval(async () => {
            if (this.speechChunksBuffer.length === 0) return;

            const chunk = this.speechChunksBuffer.shift()!;
            await this.processStage3(chunk);
        }, 100);
    }

    private async processStage3(chunk: SpeechChunk): Promise<void> {
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

            console.log(`✓ Stage 3 complete: Playing audio chunk ${chunk.id}`);
        } catch (error) {
            chunk.status = "error";
            console.error("Error in Stage 3 (Speech→Playback):", error);
        }
    }
}
