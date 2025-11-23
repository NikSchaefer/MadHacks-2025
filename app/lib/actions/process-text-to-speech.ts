"use server";

import { textToSpeech } from "../processors/text-to-speech";

/**
 * Server Action: Convert enhanced text to speech
 */
export async function processTextToSpeech(text: string, voiceId: string) {
    try {
        if (!text) {
            throw new Error("No text provided");
        }

        const audioBuffer = await textToSpeech(text, voiceId);

        console.log(
            "Generated audio buffer (size:",
            audioBuffer.length,
            "bytes)"
        );

        // Convert Buffer to base64 for transmission
        const base64Audio = audioBuffer.toString("base64");

        return { success: true, audioBase64: base64Audio };
    } catch (error) {
        console.error("Error in processTextToSpeech:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Failed to generate speech";
        return { success: false, error: errorMessage };
    }
}
