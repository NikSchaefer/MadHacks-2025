import { SpeechChunk } from "../types";

export class AudioPlayerManager {
    private audioContext: AudioContext | null = null;
    private speechBuffer: SpeechChunk[] = [];
    private isPlaying: boolean = false;
    private playbackInterval: NodeJS.Timeout | null = null;
    private currentSource: AudioBufferSourceNode | null = null;
    private currentGain: GainNode | null = null;

    private demo = false; 
    private hasDemoFaded = false;

    public markDemoMode() {
        this.demo = true;
        this.hasDemoFaded = false;
    }

    private readonly fadeSeconds = 5;

    addChunk(chunk: SpeechChunk) {
        this.speechBuffer.push(chunk);
        if (!this.isPlaying) this.startPlaybackLoop();
    }

    stop() {
        if (this.playbackInterval) clearInterval(this.playbackInterval);
        this.speechBuffer = [];
        this.isPlaying = false;
        this.demo = false;

        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch {}
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.currentSource = null;
        this.currentGain = null;
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

    public async fadeDemoIntoGenerated(nextChunk?: SpeechChunk) {
        if (!this.audioContext || !this.currentGain || !this.demo) return;

        const now = this.audioContext.currentTime;

        // Fade out demo
        this.currentGain.gain.cancelScheduledValues(now);
        this.currentGain.gain.setValueAtTime(this.currentGain.gain.value, now);
        this.currentGain.gain.linearRampToValueAtTime(0, now + this.fadeSeconds);

        // Do not stop the source immediately — let it fade naturally

        // If next chunk is provided, play it at gain 0 and fade in
        if (nextChunk) {
            const arrayBuffer = await nextChunk.speechData.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(1, now + this.fadeSeconds);

            source.connect(gain);
            gain.connect(this.audioContext.destination);

            source.start(now);

            // Track new source/gain
            this.currentSource = source;
            this.currentGain = gain;

            source.onended = () => {
                if (this.currentSource === source) this.isPlaying = false;
            };
        }

        this.hasDemoFaded = true;
        this.demo = false;
    }

    private async playChunk(chunk: SpeechChunk) {
        try {
            this.isPlaying = true;
            if (!this.audioContext) this.audioContext = new AudioContext();

            const arrayBuffer = await chunk.speechData.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(
                arrayBuffer
            );

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            const gain = this.audioContext.createGain();
            gain.gain.value = 1;

            source.connect(gain);
            source.connect(this.audioContext.destination);

            const now = this.audioContext.currentTime;

            // start playback
            source.start();
            
            // track active source
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

    public shiftNextChunk(): SpeechChunk | null {
    return this.speechBuffer.length > 0 ? this.speechBuffer.shift()! : null;
}

    getBufferLength() {
        return this.speechBuffer.length;
    }
}
