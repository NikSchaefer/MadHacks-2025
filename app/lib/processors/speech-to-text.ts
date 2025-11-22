import { FishAudioClient } from "fish-audio";

export async function speechToText(audio: Blob) {
    const fishAudio = new FishAudioClient({ apiKey: process.env.FISH_API_KEY });

    // English transcription
    const text = await fishAudio.speechToText.convert({
        audio: audio as File,
        language: "en",
    });

    return text;
}
