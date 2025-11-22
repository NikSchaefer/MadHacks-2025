import { fishAudio } from "./fish/fish-auth";
import { writeFile } from "fs/promises";
import path from "path";
import { RealtimeEvents } from "fish-audio";

export async function textToSpeech(text: string, voiceModelId: string) {
    try {
        // Call FishAudio API
        const audio = await fishAudio.textToSpeech.convert({
            text,
            reference_id: voiceModelId,
            format: "mp3", // ensure MP3 output
        });

        // Convert API Response → Buffer
        const buffer = Buffer.from(await new Response(audio).arrayBuffer());

        return buffer;
    } catch (err) {
        console.error("❌ Error generating MP3 audio:", err);
        throw err;
    }
}

export interface AudioChunk {
    id: string;
    audioData: Buffer;
    timestamp: number;
    duration: number;
    status: ChunkStatus;
}

export type ChunkStatus = "received" | "final";

export async function streamChunksToMp3WithMetadata(
    textChunks: string[],
    voiceModelId: string,
    outputFilename = "output.mp3"
): Promise<{ chunks: AudioChunk[]; outputPath: string }> {
    // Generator that yields your provided text chunks
    async function* chunkGenerator() {
        const chunks = [];

        for (const chunk of textChunks) {
            yield chunk;
        }
    }

    // const request = {
    //   text: "",
    //   reference_id: voiceModelId,
    //   format: "mp3",
    // };

    const request = { text: "" };

    const connection = await fishAudio.textToSpeech.convertRealtime(
        request,
        chunkGenerator()
    );

    const collectedBuffers: Buffer[] = [];
    const metadataChunks: AudioChunk[] = [];

    connection.on(RealtimeEvents.OPEN, () => {
        console.log("✓ WebSocket connected");
    });

    connection.on(RealtimeEvents.AUDIO_CHUNK, (audio: any) => {
        const now = Date.now();

        if (audio instanceof Uint8Array || Buffer.isBuffer(audio)) {
            const buffer = Buffer.from(audio);

            // Push to final audio file collector
            collectedBuffers.push(buffer);

            // Add structured metadata
            metadataChunks.push({
                id: crypto.randomUUID(),
                audioData: buffer,
                timestamp: now,
                duration: estimateDurationMs(buffer), // helper below
                status: "received",
            });
        }
    });

    connection.on(RealtimeEvents.ERROR, (err) => {
        console.error("❌ Stream error:", err);
    });

    return new Promise((resolve) => {
        connection.on(RealtimeEvents.CLOSE, async () => {
            const finalPath = path.resolve(process.cwd(), outputFilename);
            await writeFile(finalPath, Buffer.concat(collectedBuffers));

            console.log("✓ Saved MP3 to", finalPath);

            // Mark last chunk as "final" if exists
            if (metadataChunks.length > 0) {
                metadataChunks[metadataChunks.length - 1].status = "final";
            }

            resolve({
                chunks: metadataChunks,
                outputPath: finalPath,
            });
        });
    });
}

/**
 * Rough estimate based on MP3 bitrate.
 * Can be replaced with real parsing later if you want.
 */
function estimateDurationMs(buffer: Buffer): number {
    // Assume 128kbps MP3 unless you want to calculate dynamically
    const BITRATE = 128_000; // bits per second
    const bytes = buffer.length;
    const bits = bytes * 8;
    return (bits / BITRATE) * 1000; // ms
}
