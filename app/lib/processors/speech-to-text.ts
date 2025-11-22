import { fishAudio } from "../fish/fish-auth";

export async function speechToText(audio: Blob) {
    try {
        // Convert Blob to File (Fish Audio API expects File object)
        const file = new File([audio], "audio.webm", { type: audio.type });

        // English transcription
        const result = await fishAudio.speechToText.convert({
            audio: file,
            language: "en",
        });

        // Extract just the text string for serialization
        return { text: typeof result === 'string' ? result : result.text };
    } catch (error) {
        console.error("Error in speechToText:", error);
        throw error;
    }
}
