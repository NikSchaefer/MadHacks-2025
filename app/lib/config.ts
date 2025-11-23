import { AudioConfig } from "./types";

export const DEFAULT_CONFIG: AudioConfig = {
    chunkDurationMs: 4000, // 4 second chunks
    sampleRate: 16000,
    channels: 1,
};
