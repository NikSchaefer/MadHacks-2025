import { AudioChunk, TextSegment, AudioConfig, ProcessingQueue } from "./types";

export class AudioController {
    private config: AudioConfig;
    private mediaRecorder: MediaRecorder | null = null;

    private audioChunks: AudioChunk[];
    private textSegments: TextSegment[];

    private queue: ProcessingQueue;

    private processingInterval: NodeJS.Timeout | null = null;

    constructor(config: AudioConfig) {
        this.config = config;
        this.audioChunks = [];
        this.textSegments = [];
        this.queue = { chunks: [], segments: [], currentIndex: 0 };
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
            this.audioChunks.push({
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
        this.processingInterval = setInterval(() => {
            this.processAudioChunk(this.audioChunks[0]);
        }, this.config.chunkDurationMs);
    }

    // Stop recording
    async stopRecording(): Promise<void> {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder = null;
        }

        // Clear the audioChunks array
        this.audioChunks = [];

        // Clear the processing interval
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
    }

    // Process the audio chunk
	async processAudioChunk(chunk: AudioChunk): Promise<void>
	{
		
	}

    // Process the text segment
    async processTextSegment(segment: TextSegment): Promise<void> {}
}
