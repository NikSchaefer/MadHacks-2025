import { fishAudio } from "./fish/fish-auth";

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
