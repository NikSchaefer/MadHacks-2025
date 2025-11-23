"use server";

import { speechToText } from "../processors/speech-to-text";

/**
 * Server Action: Convert audio to text
 */
export async function processAudioToText(formData: FormData) {
    try {
        const audioFile = formData.get("audio") as Blob;

        if (!audioFile) {
            throw new Error("No audio file provided");
        }

        const text = await speechToText(audioFile);

        return { success: true, text };
    } catch (error) {
        console.error("Error in processAudioToText:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Failed to transcribe audio";
        return { success: false, error: errorMessage };
    }
}

