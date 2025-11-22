import { fishAudio } from "../fish/fish-auth";

export async function textToSpeech(text: string): Promise<Buffer> {
    try {
        // Call FishAudio API
        // TODO: Get voiceModelId from config or environment
        const voiceModelId = process.env.FISH_VOICE_MODEL_ID || "default-voice";

        const audio = await fishAudio.textToSpeech.convert({
            text,
            reference_id: voiceModelId,
            format: "mp3",
        });

        // Convert API Response → Buffer
        const buffer = Buffer.from(await new Response(audio).arrayBuffer());

        return buffer;
    } catch (err) {
        console.error("❌ Error generating MP3 audio:", err);
        throw err;
    }
}
