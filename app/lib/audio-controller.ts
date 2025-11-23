import { AudioConfig, ProcessingMetric } from "./types";
import { AudioRecorderManager } from "./audio/recorder-manager";
import { AudioPipelineManager } from "./audio/pipeline-manager";
import { AudioPlayerManager } from "./audio/player-manager";

/**
 * Modular AudioController
 * Coordinators 3 specialized managers:
 * 1. Recorder: Captures audio
 * 2. Pipeline: Processes Audio -> Text -> Script -> Audio
 * 3. Player: Queues and plays audio
 */
export class AudioController {
    private recorder: AudioRecorderManager;
    private pipeline: AudioPipelineManager;
    public player: AudioPlayerManager;

    private isRecording: boolean = false;
    private fullTranscript: string = "";
    private fullScript: string = "";

    public logs: string[] = [];
    public metrics: ProcessingMetric[] = [];

    constructor(config: AudioConfig) {
        this.player = new AudioPlayerManager();

        this.pipeline = new AudioPipelineManager(
            (metric) => this.metrics.unshift(metric),
            (msg) => this.log(msg),
            (chunk) => {
                // If we stopped recording/processing, ignore late-arriving chunks
                if (!this.isRecording && !this.isProcessingFile) {
                    this.log(
                        `⚠️ Chunk ${chunk.id}: Speech ready but ignored (stopped).`
                    );
                    return;
                }

                this.log(
                    `✅ Chunk ${chunk.id}: Speech ready. Queuing for playback.`
                );
                this.player.addChunk(chunk);
            },
            (text) => {
                this.fullTranscript += (this.fullTranscript ? " " : "") + text;
            },
            (script) => {
                this.fullScript += (this.fullScript ? " " : "") + script;
            }
        );

        // Initialize Recorder LAST so it has access to pipeline
        this.recorder = new AudioRecorderManager(config, (blob) => {
            const id = Date.now().toString();
            this.log(`🎤 Chunk ${id}: Recorded. Sending to pipeline...`);
            this.pipeline.processRecordedAudio(blob, id);
        });
    }

    public setPersona = (persona: string) => {
        this.log(`Switching persona to: ${persona}`);
        this.pipeline.setPersona(persona);
    };

    public async startRecording() {
        if (this.isRecording) return;
        this.isRecording = true;

        this.fullTranscript = "";
        this.fullScript = "";
        this.pipeline.reset();

        try {
            await this.recorder.start();
            this.log("Recording started.");
        } catch (error) {
            this.isRecording = false;
            console.error("Failed to start recording:", error);
        }
    }

    public async stopRecording() {
        if (this.isProcessingFile) {
            this.shouldStopProcessing = true;
            // Wait slightly for the loop to break
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        this.isRecording = false;
        this.recorder.stop();
        this.player.stop();
        this.pipeline.reset(); // Clear any pending items in pipeline
        this.log("Recording stopped.");
    }

    public reset() {
        this.stopRecording();
        this.fullTranscript = "";
        this.fullScript = "";
        this.pipeline.reset();
        this.log("Session reset.");
    }

    public getQueueLength() {
        // Sum of both queues in the pipeline
        // We need to expose this from PipelineManager first, but for now return 0 or implement getter
        return this.pipeline.getQueueLength();
    }

    public getPlaybackBufferLength() {
        return this.player.getBufferLength();
    }

    public markDemoMode() {
        this.player.markDemoMode();
    }

    // Getters for UI
    public getLogs = () => this.logs;
    public getMetrics = () => this.metrics;
    public getIsRecording = () => this.isRecording;
    public getFullTranscript = () => this.fullTranscript;
    public getFullScript = () => this.fullScript;

    private log(message: string) {
        const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.unshift(logEntry);
        console.log(message);
        if (this.logs.length > 1000) this.logs.pop();
    }

    public getIsProcessingFile() {
        return this.isProcessingFile;
    }

    private isProcessingFile = false;
    private shouldStopProcessing = false;

    // Passthrough for legacy file support (if needed)
    async processFile(file: File) {
        if (this.isProcessingFile) return;
        this.isProcessingFile = true;
        this.shouldStopProcessing = false;

        this.log(`Processing file: ${file.name}`);
        this.fullTranscript = "";
        this.fullScript = "";
        this.pipeline.reset();

        try {
            const arrayBuffer = await file.arrayBuffer();
            // Create offline context or standard context to decode
            const audioContext = new (window.AudioContext ||
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Chunk duration in seconds
            const chunkDuration = 10;
            const sampleRate = audioBuffer.sampleRate;
            const samplesPerChunk = chunkDuration * sampleRate;

            const totalDuration = audioBuffer.duration;
            const totalChunks = Math.ceil(totalDuration / chunkDuration);

            this.log(
                `Audio duration: ${totalDuration.toFixed(
                    2
                )}s. Splitting into ${totalChunks} chunks of ${chunkDuration}s.`
            );

            for (let i = 0; i < totalChunks; i++) {
                const startSample = i * samplesPerChunk;
                const endSample = Math.min(
                    (i + 1) * samplesPerChunk,
                    audioBuffer.length
                );
                const frameCount = endSample - startSample;

                // Create a new buffer for this chunk
                const chunkBuffer = audioContext.createBuffer(
                    audioBuffer.numberOfChannels,
                    frameCount,
                    sampleRate
                );

                // Copy channel data
                for (
                    let channel = 0;
                    channel < audioBuffer.numberOfChannels;
                    channel++
                ) {
                    const channelData = audioBuffer.getChannelData(channel);
                    const chunkChannelData =
                        chunkBuffer.getChannelData(channel);
                    chunkChannelData.set(
                        channelData.subarray(startSample, endSample)
                    );
                }

                // Convert to WAV
                const chunkBlob = this.audioBufferToWav(chunkBuffer);

                const id = `file-${Date.now()}-${i}`;
                this.log(
                    `🎤 Chunk ${id}: File slice ${i + 1}/${totalChunks} (${
                        chunkBlob.size
                    } bytes).`
                );

                // Send to pipeline
                this.pipeline.processRecordedAudio(chunkBlob, id);

                // Simulate network/recording delay
                await new Promise((resolve) => setTimeout(resolve, 2000));

                if (this.shouldStopProcessing) {
                    this.log("File processing stopped by user.");
                    break;
                }
            }

            // Close context to free resources
            if (audioContext.state !== "closed") {
                await audioContext.close();
            }
        } catch (err) {
            this.log(`Error processing file: ${err}`);
            console.error(err);
        } finally {
            this.isProcessingFile = false;
        }
    }

    private audioBufferToWav(buffer: AudioBuffer): Blob {
        const numOfChan = buffer.numberOfChannels;
        const length = buffer.length * numOfChan * 2 + 44;
        const bufferArr = new ArrayBuffer(length);
        const view = new DataView(bufferArr);
        const channels = [];
        let i;
        let sample;
        let pos = 0;

        // write WAVE header
        // "RIFF"
        view.setUint32(0, 0x52494646, false);
        // file length - 8
        view.setUint32(4, length - 8, true);
        // "WAVE"
        view.setUint32(8, 0x57415645, false);

        // "fmt " chunk
        view.setUint32(12, 0x666d7420, false);
        // length = 16
        view.setUint32(16, 16, true);
        // PCM (uncompressed)
        view.setUint16(20, 1, true);
        // Number of channels
        view.setUint16(22, numOfChan, true);
        // Sample rate
        view.setUint32(24, buffer.sampleRate, true);
        // Byte rate (sampleRate * blockAlign)
        view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
        // Block align (channelCount * bytesPerSample)
        view.setUint16(32, numOfChan * 2, true);
        // Bits per sample
        view.setUint16(34, 16, true);

        // "data" - chunk
        view.setUint32(36, 0x64617461, false);
        // data chunk length
        view.setUint32(40, length - 44, true);

        // write interleaved data
        for (i = 0; i < buffer.numberOfChannels; i++)
            channels.push(buffer.getChannelData(i));

        pos = 44;
        let offset_idx = 0;

        while (offset_idx < buffer.length) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset_idx])); // clamp
                // scale to 16-bit signed int
                sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset_idx++;
        }

        return new Blob([bufferArr], { type: "audio/wav" });
    }
}
