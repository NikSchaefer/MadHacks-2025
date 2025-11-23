"use server";

import { textToScript } from "../processors/text-to-script";

/**
 * Server Action: Enhance text with AI
 */
export async function processTextToScript(
    text: string,
    previousText: string = "",
    previousScript: string = "",
    persona: string = "lecturer"
) {
    try {
        if (!text) {
            throw new Error("No text provided");
        }

        const enhancedText = await textToScript({
            previousText,
            newText: text,
            previousScript,
            persona,
        });

        return { success: true, enhancedText };
    } catch (error) {
        console.error("Error in processTextToScript:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to enhance text";
        return { success: false, error: errorMessage };
    }
}

