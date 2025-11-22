import { AudioChunk, TextSegment, AudioConfig, SpeechChunk } from "./types";

export class AudioController {
    private config: AudioConfig;
    private mediaRecorder: MediaRecorder | null = null;

    private audioChunksQueue: AudioChunk[];
    private textSegmentsQueue: TextSegment[];
    private speechChunksQueue: SpeechChunk[];

    private processingInterval: NodeJS.Timeout | null = null;

    constructor(config: AudioConfig) {
        this.config = config;
        this.audioChunksQueue = [];
        this.textSegmentsQueue = [];
        this.speechChunksQueue = [];
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

    // Start recording in each chunk, adding to the audioChunks array
    async startRecording(): Promise<void> {
        // Request access to the microphone
        const mediaStream = await this.setupMicrophone();

        // Create a new MediaRecorder instance
        this.mediaRecorder = new MediaRecorder(mediaStream);

        // Add the audio chunks to the audioChunks array
        this.mediaRecorder.ondataavailable = (e) => {
            this.audioChunksQueue.push({
                id: Date.now().toString(),
                audioData: e.data,
                timestamp: Date.now(),
                duration: this.config.chunkDurationMs,
                status: "pending",
            });
        };

        // Start recording in each chunk, adding to the audioChunks array
        this.mediaRecorder.start();

        // Process the audio chunks at regular intervals
        this.processingInterval = setInterval(async () => {
            const chunk = this.audioChunksQueue.shift();
            if (!chunk) return;
            await this.processAudioChunk(chunk);
        }, this.config.chunkDurationMs);
    }

    // Stop recording
    async stopRecording(): Promise<void> {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder = null;
        }

        // Clear the queues
        this.audioChunksQueue = [];
        this.textSegmentsQueue = [];
        this.speechChunksQueue = [];

        // Clear the processing interval
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
    }

    // Process the audio chunk into a text segment
    async processAudioChunk(chunk: AudioChunk): Promise<void> {
        try {
            const text = await speechToText(chunk);
            this.textSegmentsQueue.push({
                id: chunk.id,
                original: text,
                translated: "",
                timestamp: chunk.timestamp,
                status: "pending",
            });
        } catch (error) {
            console.error("Error processing audio chunk:", error);
            throw error;
        }
    }

    // Process the text segment into a speech chunk
    async processTextSegment(segment: TextSegment): Promise<void> {}

    // Process the speech chunk into a audio chunk
    async processSpeechChunk(chunk: SpeechChunk): Promise<void> {}
}
