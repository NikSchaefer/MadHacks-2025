import { SpeechChunk } from "../types";

export class AudioPlayerManager {
    private audioContext: AudioContext | null = null;
    private speechBuffer: SpeechChunk[] = [];
    private isPlaying: boolean = false;
    private playbackInterval: NodeJS.Timeout | null = null;

    addChunk(chunk: SpeechChunk) {
        this.speechBuffer.push(chunk);
        if (!this.isPlaying) this.startPlaybackLoop();
    }

    stop() {
        if (this.playbackInterval) clearInterval(this.playbackInterval);
        this.speechBuffer = [];
        this.isPlaying = false;
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
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
            if (!this.audioContext) this.audioContext = new AudioContext();

            const arrayBuffer = await chunk.speechData.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(
                arrayBuffer
            );

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);

            source.onended = () => {
                this.isPlaying = false;
            };

            source.start();
        } catch (error) {
            console.error("❌ Playback error:", error);
            this.isPlaying = false;
        }
    }

    getBufferLength() {
        return this.speechBuffer.length;
    }
}
