import { processAudioToText } from "../actions/process-audio-to-text";
import { processTextToScript } from "../actions/process-text-to-script";
import { processTextToSpeech } from "../actions/process-text-to-speech";
import { ProcessingMetric, SpeechChunk } from "../types";

interface TranscriptItem {
    id: string;
    text: string;
    timestamp: number;
}

interface ScriptItem {
    id: string;
    script: string;
    timestamp: number;
}

export class AudioPipelineManager {
    private transcriptQueue: TranscriptItem[] = [];
    private enhanceQueue: ScriptItem[] = [];

    // Context for AI
    private contextWindowText: string = "";
    private contextWindowScript: string = "";

    // Persona state
    private currentPersona: string = "lecturer";

    // Processing State
    private isProcessingScripts: boolean = false;
    private isGeneratingSpeech: boolean = false;

    // Callbacks
    private onMetric: (metric: ProcessingMetric) => void;
    private onLog: (msg: string) => void;
    private onSpeechReady: (chunk: SpeechChunk) => void;
    private onTranscriptUpdate: (text: string) => void;
    private onScriptUpdate: (text: string) => void;

    constructor(
        onMetric: (metric: ProcessingMetric) => void,
        onLog: (msg: string) => void,
        onSpeechReady: (chunk: SpeechChunk) => void,
        onTranscriptUpdate: (text: string) => void,
        onScriptUpdate: (text: string) => void
    ) {
        this.onMetric = onMetric;
        this.onLog = onLog;
        this.onSpeechReady = onSpeechReady;
        this.onTranscriptUpdate = onTranscriptUpdate;
        this.onScriptUpdate = onScriptUpdate;
    }

    public reset() {
        this.transcriptQueue = [];
        this.enhanceQueue = [];
        this.contextWindowText = "";
        this.contextWindowScript = "";
        this.isProcessingScripts = false;
        this.isGeneratingSpeech = false;
    }

    public setPersona(persona: string) {
        this.currentPersona = persona;
    }

    /**
     * HYBRID APPROACH:
     * We use the decoupled pipeline for maximum flexibility and streaming,
     * BUT we can also use a combined "Full Pipeline" call if we want to minimize round-trips.
     *
     * For now, we stick to the DECOUPLED approach because:
     * 1. The user wants Fluidity.
     * 2. Decoupled allows us to process Chunk 2's STT while Chunk 1 is doing TTS.
     * 3. If we use "Full Pipeline", we block everything until TTS is done.
     *
     * However, to address the user's concern about latency:
     * - The Client->Server latency is usually small (20-50ms) compared to AI generation (500ms+).
     * - Sending 3 small requests is often better than 1 giant request because we get *intermediate feedback*.
     * - If we bundle, we can't show the transcript until the audio is ready!
     */

    public getQueueLength() {
        return this.transcriptQueue.length + this.enhanceQueue.length;
    }

    public async processRecordedAudio(blob: Blob, id: string) {
        const startTime = Date.now();
        this.onLog(`🎤 Chunk ${id}: Processing STT...`);

        try {
            const formData = new FormData();
            formData.append("audio", blob);
            const result = await processAudioToText(formData);

            if (!result.success || !result.text) {
                this.onLog(`⚠️ Chunk ${id}: STT failed.`);
                return;
            }

            const duration = Date.now() - startTime;
            this.onMetric({ id, step: "stt", duration, timestamp: Date.now() });

            this.onTranscriptUpdate(result.text);

            this.transcriptQueue.push({
                id,
                text: result.text,
                timestamp: Date.now(),
            });
            // Only start the script queue if it's not already running
            if (!this.isProcessingScripts) {
                this.processScriptQueue(this.currentPersona);
            }
        } catch (err) {
            console.error(`Error in STT for chunk ${id}:`, err);
        }
    }

    public async processScriptQueue(persona: string = "lecturer") {
        // Update stored persona
        this.currentPersona = persona;

        if (this.isProcessingScripts || this.transcriptQueue.length === 0)
            return;
        this.isProcessingScripts = true;

        try {
            while (this.transcriptQueue.length > 0) {
                const item = this.transcriptQueue.shift()!;
                const startTime = Date.now();

                const result = await processTextToScript(
                    item.text,
                    this.contextWindowText,
                    this.contextWindowScript,
                    this.currentPersona
                );

                if (!result.success || !result.enhancedText) {
                    this.onLog(`⚠️ Chunk ${item.id}: Enhancement failed.`);
                    continue;
                }

                const duration = Date.now() - startTime;
                this.onMetric({
                    id: item.id,
                    step: "enhance",
                    duration,
                    timestamp: Date.now(),
                });

                this.onScriptUpdate(result.enhancedText);

                // Update context with only the last 1000 characters of the text and script
                this.contextWindowText = (
                    this.contextWindowText +
                    " " +
                    item.text
                ).slice(-1000);
                this.contextWindowScript = (
                    this.contextWindowScript +
                    " " +
                    result.enhancedText
                ).slice(-1000);

                this.enhanceQueue.push({
                    id: item.id,
                    script: result.enhancedText,
                    timestamp: Date.now(),
                });

                this.processSpeechQueue();
            }
        } finally {
            this.isProcessingScripts = false;
            if (this.transcriptQueue.length > 0)
                this.processScriptQueue(this.currentPersona);
        }
    }

    private async processSpeechQueue() {
        if (this.isGeneratingSpeech || this.enhanceQueue.length === 0) return;
        this.isGeneratingSpeech = true;

        try {
            while (this.enhanceQueue.length > 0) {
                const item = this.enhanceQueue.shift()!;
                const startTime = Date.now();

                const result = await processTextToSpeech(item.script);

                if (!result.success || !result.audioBase64) {
                    this.onLog(`⚠️ Chunk ${item.id}: TTS failed.`);
                    continue;
                }

                const duration = Date.now() - startTime;
                this.onMetric({
                    id: item.id,
                    step: "tts",
                    duration,
                    timestamp: Date.now(),
                });

                const audioBytes = Uint8Array.from(
                    atob(result.audioBase64),
                    (c) => c.charCodeAt(0)
                );
                const audioBlob = new Blob([audioBytes], { type: "audio/mp3" });

                this.onSpeechReady({
                    id: item.id,
                    speechData: audioBlob,
                    timestamp: item.timestamp,
                    duration: 0,
                    status: "pending",
                });
            }
        } finally {
            this.isGeneratingSpeech = false;
            if (this.enhanceQueue.length > 0) this.processSpeechQueue();
        }
    }
}
