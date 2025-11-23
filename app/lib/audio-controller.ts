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
    private player: AudioPlayerManager;

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

    public setPersona(persona: string) {
        this.log(`Switching persona to: ${persona}`);
        this.pipeline.setPersona(persona);
    }

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
        this.isRecording = false;
        this.recorder.stop();
        this.player.stop();
        this.log("Recording stopped.");
    }

    public getQueueLength() {
        // Sum of both queues in the pipeline
        // We need to expose this from PipelineManager first, but for now return 0 or implement getter
        return this.pipeline.getQueueLength();
    }

    public getPlaybackBufferLength() {
        return this.player.getBufferLength();
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

    // Passthrough for legacy file support (if needed)
    async processFile(file: File) {
        this.log(`Processing file: ${file.name}`);
        this.fullTranscript = "";
        this.fullScript = "";
        this.pipeline.reset();

        // Simple simulation: Read file, pretend it's one big chunk or split it?
        // For hackathon speed, let's just send the whole file as one chunk
        // (or better, split it in the controller if we want to test streaming).
        // To keep it modular, we could ask the recorder to "record from file"
        // but that's complex. Let's just inject it into the pipeline directly.

        try {
            const blob = new Blob([file], { type: file.type });
            this.pipeline.processRecordedAudio(blob, "file-upload");
        } catch (err) {
            this.log(`Error processing file: ${err}`);
        }
    }
}
