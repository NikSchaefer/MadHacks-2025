import { fishAudio } from "../fish/fish-auth";

export async function textToSpeech(text: string): Promise<Buffer> {
    try {
        // Call FishAudio API
        const audio = await fishAudio.textToSpeech.convert({
            text,
            format: "mp3",
            reference_id: "933563129e564b19a115bedd57b7406a"
        });

        // Convert API Response → Buffer
        const buffer = Buffer.from(await new Response(audio).arrayBuffer());

        return buffer;
    } catch (err) {
        console.error("❌ Error generating MP3 audio:", err);
        throw err;
    }
}
