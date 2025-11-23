import { AudioConfig } from "../types";

export class AudioRecorderManager {
    private mediaRecorder: MediaRecorder | null = null;
    private mediaStream: MediaStream | null = null;
    private recordingTimer: NodeJS.Timeout | null = null;
    private config: AudioConfig;
    private onChunkRecorded: (blob: Blob) => void;
    private isRecording: boolean = false;

    constructor(config: AudioConfig, onChunkRecorded: (blob: Blob) => void) {
        this.config = config;
        this.onChunkRecorded = onChunkRecorded;
    }

    async start(): Promise<void> {
        try {
            this.isRecording = true;
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            this.recordNextChunk();
        } catch (error) {
            this.isRecording = false;
            console.error("Error starting recording:", error);
            throw error;
        }
    }

    private recordNextChunk(): void {
        if (!this.isRecording || !this.mediaStream) return;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm";

        const recorder = new MediaRecorder(this.mediaStream, { mimeType });
        this.mediaRecorder = recorder;
        const chunkData: Blob[] = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunkData.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunkData, { type: mimeType });
            if (blob.size > 0) {
                this.onChunkRecorded(blob);
            }

            // Loop if still recording
            if (this.isRecording) {
                this.recordNextChunk();
            }
        };

        recorder.start();
        this.recordingTimer = setTimeout(() => {
            if (recorder.state === "recording") recorder.stop();
        }, this.config.chunkDurationMs);
    }

    stop(): void {
        this.isRecording = false;
        if (this.recordingTimer) clearTimeout(this.recordingTimer);

        // Stop current recorder if running
        if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
            this.mediaRecorder.stop();
        }

        // Stop stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((t) => t.stop());
            this.mediaStream = null;
        }
    }
}
