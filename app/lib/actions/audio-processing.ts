"use server";

import { speechToText } from "../processors/speech-to-text";
import { textToScript } from "../processors/text-to-script";
import { textToSpeech } from "../processors/text-to-speech";

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

/**
 * Server Action: Enhance text with AI
 */
export async function processTextToScript(
    text: string,
    previousText: string = "",
    previousScript: string = ""
) {
    try {
        if (!text) {
            throw new Error("No text provided");
        }

        const enhancedText = await textToScript({
            previousText,
            newText: text,
            previousScript,
        });

        return { success: true, enhancedText };
    } catch (error) {
        console.error("Error in processTextToScript:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to enhance text";
        return { success: false, error: errorMessage };
    }
}

/**
 * Server Action: Convert enhanced text to speech
 */
export async function processTextToSpeech(text: string) {
    try {
        if (!text) {
            throw new Error("No text provided");
        }

        console.log("Converting text to speech (length:", text.length, ")");

        const audioBuffer = await textToSpeech(text);

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

/**
 * Combined Server Action: Full pipeline in one call
 * Audio → Text → Enhanced Script → Speech
 */
export async function processFullPipeline(formData: FormData) {
    try {
        console.log("=== Starting Full Pipeline ===");
        const startTime = Date.now();

        // Extract context from formData
        const previousText = (formData.get("previousText") as string) || "";
        const previousScript = (formData.get("previousScript") as string) || "";

        // Step 1: Audio → Text
        console.log("Step 1: Audio → Text");
        const audioResult = await processAudioToText(formData);
        if (!audioResult.success) {
            console.error("Step 1 failed:", audioResult.error);
            return { success: false, error: audioResult.error };
        }
        const { text } = audioResult;
        if (!text || text.trim() === "") {
            console.log("No text detected in audio, skipping pipeline");
            return {
                success: true,
                originalText: "",
                enhancedText: "",
                audioBase64: "",
                skipped: true,
            };
        }
        console.log(`Step 1 completed in ${Date.now() - startTime}ms`);

        // Step 2: Text → Enhanced Script
        console.log("Step 2: Text → Enhanced Script");
        const scriptResult = await processTextToScript(
            text,
            previousText,
            previousScript
        );
        if (!scriptResult.success) {
            console.error("Step 2 failed:", scriptResult.error);
            return { success: false, error: scriptResult.error };
        }
        const { enhancedText } = scriptResult;
        if (!enhancedText) {
            return { success: false, error: "No enhanced text provided" };
        }
        console.log(`Step 2 completed in ${Date.now() - startTime}ms`);

        // Step 3: Enhanced Script → Speech
        console.log("Step 3: Enhanced Script → Speech");
        const speechResult = await processTextToSpeech(enhancedText);
        if (!speechResult.success) {
            console.error("Step 3 failed:", speechResult.error);
            return { success: false, error: speechResult.error };
        }
        console.log(`Step 3 completed in ${Date.now() - startTime}ms`);

        return {
            success: true,
            originalText: text,
            enhancedText,
            audioBase64: speechResult.audioBase64,
        };
    } catch (error) {
        console.error("Error in processFullPipeline:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Failed to process audio pipeline";
        return { success: false, error: errorMessage };
    }
}
