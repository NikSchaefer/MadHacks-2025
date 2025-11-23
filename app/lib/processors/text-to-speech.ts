import { fishAudio } from "../fish/fish-auth";

export async function textToSpeech(text: string, referenceId: string): Promise<Buffer> {
    try {
        // Call FishAudio API
        const audio = await fishAudio.textToSpeech.convert({
            text,
            format: "mp3",
            reference_id: referenceId,
        });

        // Convert API Response → Buffer
        const buffer = Buffer.from(await new Response(audio).arrayBuffer());

        return buffer;
    } catch (err) {
        console.error("❌ Error generating MP3 audio:", err);
        throw err;
    }
}
