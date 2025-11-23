import { SpeechChunk } from "../types";

export type AudioMode = "original" | "ai";

export class AudioPlayerManager {
    private audioContext: AudioContext | null = null;
    private speechBuffer: SpeechChunk[] = [];
    private isPlaying: boolean = false;
    private playbackInterval: NodeJS.Timeout | null = null;

    // AI Stream (Generated Speech)
    private currentSource: AudioBufferSourceNode | null = null;
    private currentGain: GainNode | null = null;

    // Background Stream (Original Lecture)
    private backgroundSource: AudioBufferSourceNode | null = null;
    private backgroundGain: GainNode | null = null;

    private mode: AudioMode = "original";

    private getContext() {
        if (!this.audioContext) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.audioContext = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    public setMode(mode: AudioMode) {
        this.mode = mode;
        this.updateGains();
    }

    private updateGains() {
        if (!this.audioContext) return;
        const now = this.audioContext.currentTime;
        const FADE_TIME = 0.1; // fast crossfade

        // Target gains based on mode
        const targetBgGain = this.mode === "original" ? 1 : 0;
        const targetAiGain = this.mode === "ai" ? 1 : 0;

        if (this.backgroundGain) {
            this.backgroundGain.gain.setTargetAtTime(
                targetBgGain,
                now,
                FADE_TIME
            );
        }

        // If we have a background source running (Demo Mode), the AI track should listen to the toggle.
        // BUT if we are in Normal Mode (no background source), the AI track is the MAIN track, so it should always be audible.
        if (this.currentGain) {
            // If background source exists, we are in Demo Mode -> Respect Toggle
            if (this.backgroundSource) {
                this.currentGain.gain.setTargetAtTime(
                    targetAiGain,
                    now,
                    FADE_TIME
                );
            } else {
                // Normal Mode -> Always Play
                this.currentGain.gain.setTargetAtTime(1, now, FADE_TIME);
            }
        }
    }

    public async startBackground(blob: Blob) {
        const ctx = this.getContext();

        // Stop existing background
        if (this.backgroundSource) {
            try {
                this.backgroundSource.stop();
            } catch {}
        }

        try {
            const arrayBuffer = await blob.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            this.backgroundSource = ctx.createBufferSource();
            this.backgroundSource.buffer = audioBuffer;

            this.backgroundGain = ctx.createGain();
            // Initialize gain based on current mode
            this.backgroundGain.gain.value = this.mode === "original" ? 1 : 0;

            this.backgroundSource.connect(this.backgroundGain);
            this.backgroundGain.connect(ctx.destination);

            this.backgroundSource.start(0);
        } catch (err) {
            console.error("Failed to start background audio:", err);
        }
    }

    addChunk(chunk: SpeechChunk) {
        this.speechBuffer.push(chunk);
        if (!this.isPlaying) this.startPlaybackLoop();
    }

    stop() {
        if (this.playbackInterval) clearInterval(this.playbackInterval);
        this.speechBuffer = [];
        this.isPlaying = false;

        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch {}
        }
        if (this.backgroundSource) {
            try {
                this.backgroundSource.stop();
            } catch {}
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.currentSource = null;
        this.currentGain = null;
        this.backgroundSource = null;
        this.backgroundGain = null;
    }

    private startPlaybackLoop() {
        if (this.playbackInterval) clearInterval(this.playbackInterval);
        this.playbackInterval = setInterval(() => {
            if (this.speechBuffer.length > 0 && !this.isPlaying) {
                const chunk = this.speechBuffer.shift()!;
                this.playChunk(chunk);
            }
        }, 100);
    }

    private async playChunk(chunk: SpeechChunk) {
        try {
            this.isPlaying = true;
            const ctx = this.getContext();

            const arrayBuffer = await chunk.speechData.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;

            const gain = ctx.createGain();

            // LOGIC FIX:
            // If we are in Demo Mode (background source exists), we default to 0 if mode is 'original'
            // If we are in Normal Mode, we default to 1.
            if (this.backgroundSource) {
                gain.gain.value = this.mode === "ai" ? 1 : 0;
            } else {
                gain.gain.value = 1;
            }

            source.connect(gain);
            gain.connect(ctx.destination);

            source.start(0);

            this.currentSource = source;
            this.currentGain = gain;

            source.onended = () => {
                if (this.currentSource === source) {
                    this.isPlaying = false;
                }
            };
        } catch (error) {
            console.error("❌ Playback error:", error);
            this.isPlaying = false;
        }
    }

    getBufferLength() {
        return this.speechBuffer.length;
    }
}
