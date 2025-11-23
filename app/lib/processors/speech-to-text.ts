import { fishAudio } from "../fish/fish-auth";

export async function speechToText(audio: Blob) {
    try {
        // Validate audio blob
        if (!audio || audio.size === 0) {
            console.warn("Empty audio blob received, returning empty string");
            return "";
        }

        // Log blob details for debugging
        console.log("Processing audio blob:", {
            size: audio.size,
            type: audio.type,
        });

        // Check minimum size (e.g., 1KB) to avoid sending incomplete chunks
        if (audio.size < 1000) {
            console.warn("Audio blob too small, likely incomplete. Skipping.");
            return "";
        }

        // Convert Blob to File (Fish Audio API expects File object)
        const file = new File([audio], "audio.webm", { type: audio.type });

        // English transcription
        const result = await fishAudio.speechToText.convert({
            audio: file,
            language: "en",
        });

        // Extract just the text string for serialization
        console.log("Transcription successful:", result.text);
        return result.text;
    } catch (error) {
        console.error("Error in speechToText:", error);
        // Log more details about the error
        if (error && typeof error === "object") {
            console.error("Error details:", JSON.stringify(error, null, 2));
        }
        throw error;
    }
}
