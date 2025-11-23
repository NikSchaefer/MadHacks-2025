import {
    AudioChunk,
    AudioConfig,
    SpeechChunk,
    ProcessingMetric,
} from "./types";
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

    // Debug/Metrics
    public logs: string[] = [];
    public metrics: ProcessingMetric[] = [];

    constructor(config: AudioConfig) {
        this.config = config;
    }

    private log(message: string) {
        const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.unshift(logEntry);
        console.log(message);

        // Keep logs size manageable
        if (this.logs.length > 1000) {
            this.logs.pop();
        }
    }

    public getLogs(): string[] {
        return this.logs;
    }

    public getMetrics(): ProcessingMetric[] {
        return this.metrics;
    }

    public getQueueLength(): number {
        return this.audioProcessingQueue.length;
    }

    public getPlaybackBufferLength(): number {
        return this.speechChunksBuffer.length;
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

    /**
     * Simulates streaming by processing an existing audio file
     * Splits the file into chunks and processes them sequentially
     */
    async processFile(file: File): Promise<void> {
        if (this.isProcessing) return;

        this.log(`Processing file: ${file.name} (${file.size} bytes)`);

        // Reset state
        this.fullTranscript = "";
        this.fullScript = "";
        this.startSpeechProcessing();

        // We'll slice the file into chunks based on the config duration
        // This is an approximation since we don't know the exact byte/time ratio without decoding
        // But for testing, slicing by size is often sufficient if we estimate bitrate

        // Estimate: 32kbps opus = 4KB/s. Let's assume a safe chunk size.
        // Better approach: Decode the whole file, then slice the AudioBuffer

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioContext = new AudioContext();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const totalDuration = audioBuffer.duration;
            const sampleRate = audioBuffer.sampleRate;
            const numberOfChannels = audioBuffer.numberOfChannels;
            const chunkDuration = this.config.chunkDurationMs / 1000; // seconds

            this.log(
                `File duration: ${totalDuration.toFixed(
                    1
                )}s, splitting into ~${chunkDuration}s chunks`
            );

            let currentTime = 0;
            let chunkIndex = 0;

            while (currentTime < totalDuration) {
                const chunkLength = Math.min(
                    chunkDuration,
                    totalDuration - currentTime
                );
                const frameCount = Math.floor(chunkLength * sampleRate);
                const startFrame = Math.floor(currentTime * sampleRate);

                // Create a new buffer for this chunk
                const chunkBuffer = audioContext.createBuffer(
                    numberOfChannels,
                    frameCount,
                    sampleRate
                );

                // Copy data channel by channel
                for (let channel = 0; channel < numberOfChannels; channel++) {
                    const channelData = audioBuffer.getChannelData(channel);
                    const chunkChannelData =
                        chunkBuffer.getChannelData(channel);

                    // Copy the segment
                    for (let i = 0; i < frameCount; i++) {
                        if (startFrame + i < channelData.length) {
                            chunkChannelData[i] = channelData[startFrame + i];
                        }
                    }
                }

                // Convert chunk buffer to Blob (wav/mp3 simulation)
                // Since we can't easily encode to MP3/WebM in browser without heavy libraries like ffmpeg.wasm,
                // we'll send the raw WAV data which is supported by most backends, or a simple wav header.
                const wavBlob = await this.audioBufferToWav(chunkBuffer);

                const chunk: AudioChunk = {
                    id: `file-${chunkIndex++}`,
                    audioData: wavBlob,
                    timestamp: Date.now(),
                    duration: chunkLength * 1000,
                    status: "pending",
                };

                this.audioProcessingQueue.push(chunk);
                currentTime += chunkDuration;
            }

            this.log(
                `Queued ${this.audioProcessingQueue.length} chunks from file`
            );
            this.processQueue();
        } catch (error) {
            this.log(`Error processing file: ${error}`);
            console.error(error);
        }
    }

    // Helper to convert AudioBuffer to WAV Blob
    private audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
        return new Promise((resolve) => {
            const length = buffer.length * buffer.numberOfChannels * 2 + 44;
            const arrayBuffer = new ArrayBuffer(length);
            const view = new DataView(arrayBuffer);
            const channels = [];
            let offset = 0;
            let pos = 0;

            // write WAVE header
            setUint32(0x46464952); // "RIFF"
            setUint32(length - 8); // file length - 8
            setUint32(0x45564157); // "WAVE"

            setUint32(0x20746d66); // "fmt " chunk
            setUint32(16); // length = 16
            setUint16(1); // PCM (uncompressed)
            setUint16(buffer.numberOfChannels);
            setUint32(buffer.sampleRate);
            setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // avg. bytes/sec
            setUint16(buffer.numberOfChannels * 2); // block-align
            setUint16(16); // 16-bit (hardcoded in this example)

            setUint32(0x61746164); // "data" - chunk
            setUint32(length - pos - 4); // chunk length

            // write interleaved data
            for (let i = 0; i < buffer.numberOfChannels; i++)
                channels.push(buffer.getChannelData(i));

            while (pos < buffer.length) {
                for (let i = 0; i < buffer.numberOfChannels; i++) {
                    let sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
                    sample =
                        (0.5 + sample < 0 ? sample * 32768 : sample * 32767) |
                        0; // scale to 16-bit signed int
                    view.setInt16(44 + offset, sample, true);
                    offset += 2;
                }
                pos++;
            }

            resolve(new Blob([arrayBuffer], { type: "audio/wav" }));

            function setUint16(data: number) {
                view.setUint16(pos, data, true);
                pos += 2;
            }

            function setUint32(data: number) {
                view.setUint32(pos, data, true);
                pos += 4;
            }
        });
    }

    private processQueue(): void {
        if (this.isProcessing || this.audioProcessingQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        // Use a recursive function to chain promises
        const processNext = () => {
            if (this.audioProcessingQueue.length === 0) {
                this.isProcessing = false;
                return;
            }

            const chunk = this.audioProcessingQueue.shift()!;

            // Chain the next chunk processing after this one completes (success or fail)
            this.processStage1(chunk)
                .then(() => {
                    processNext();
                })
                .catch((err) => {
                    console.error("Queue processing error:", err);
                    processNext(); // Continue even if one fails
                });
        };

        // Start the chain
        processNext();
    }

    public async processStage1(chunk: AudioChunk): Promise<void> {
        const startTime = Date.now();
        try {
            chunk.status = "transcribing";
            this.log(`Starting processing for chunk ${chunk.id}`);

            // Create FormData with audio blob
            const formData = new FormData();
            formData.append("audio", chunk.audioData);
            formData.append("previousText", this.fullTranscript);
            formData.append("previousScript", this.fullScript);

            // Call server action for full pipeline: Audio → Text → Script → Speech
            const result = await processFullPipeline(formData);

            if (!result.success) {
                throw new Error(result.error);
            }

            const duration = Date.now() - startTime;
            this.metrics.unshift({
                id: chunk.id,
                step: "pipeline",
                duration,
                timestamp: Date.now(),
                details: "Full pipeline success",
            });

            // If the audio is empty, don't process it
            if (result.skipped || !result.audioBase64) {
                this.log(`Skipped empty/silent chunk ${chunk.id}`);
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

            this.log(`✓ Stage 1 complete for ${chunk.id} in ${duration}ms`);
        } catch (error) {
            chunk.status = "error";
            const duration = Date.now() - startTime;
            this.log(`Error in Stage 1 for ${chunk.id}: ${error}`);
            this.metrics.unshift({
                id: chunk.id,
                step: "pipeline",
                duration,
                timestamp: Date.now(),
                error: true,
                details: String(error),
            });
        }
    }

    private audioContext: AudioContext | null = null;

    private isPlaying: boolean = false;

    private startSpeechProcessing(): void {
        this.speechInterval = setInterval(() => {
            if (this.speechChunksBuffer.length === 0 || this.isPlaying) return;

            const chunk = this.speechChunksBuffer.shift()!;
            this.playSpeech(chunk);
        }, 100);
    }

    private async playSpeech(chunk: SpeechChunk): Promise<void> {
        try {
            this.isPlaying = true;
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

            // When this audio finishes, mark as not playing so next chunk can start
            source.onended = () => {
                this.isPlaying = false;
                this.log(`✓ Finished playing chunk ${chunk.id}`);
            };

            source.start();
            this.log(
                `▶ Playing audio chunk ${
                    chunk.id
                } (${audioBuffer.duration.toFixed(1)}s)`
            );
        } catch (error) {
            this.isPlaying = false;
            chunk.status = "error";
            this.log(`Error in Speech (Playback): ${error}`);
        }
    }
}
