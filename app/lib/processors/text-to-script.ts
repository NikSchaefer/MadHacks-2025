import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getVoicePrompt } from "@/data/voices";

export async function textToScript({
    previousText,
    newText,
    previousScript,
    persona = "933563129e564b19a115bedd57b7406a", // Default to Sarah
}: {
    previousText: string;
    newText: string;
    previousScript: string;
    persona?: string;
}) {
    if (!newText) {
        throw new Error("Missing new text");
    }

    const systemPersona = getVoicePrompt(persona);

    const result = await generateText({
        model: google("gemini-2.5-flash-lite"),
        prompt: `${systemPersona} Polish the following lecture script to be as concise and clear as possible, so that the average college student can understand it. Limit the response to single sentences. 

CURRENT STATE:
Previous script (already transcribed text): 
"""
${previousScript}
"""

NEW RAW TRANSCRIPTION (new text to transcribe):
"""
${newText}
"""
`,
    });

    return result.text;
}

// RECENT RAW CONTEXT (for reference only):
// """
// ${previousText || "[No previous context]"}
// """

// YOUR TASK:
// Continue the polished lecture script by transforming ONLY the new transcription segment. This will be converted to speech and streamed in real-time, so quality and continuity are critical.

// REQUIREMENTS:

// 1. **SEAMLESS CONTINUATION**: The output must flow naturally from where previousScript ended - pick up mid-sentence if needed
// 2. **REAL-TIME OPTIMIZATION**: Be fast and decisive - convert raw speech to polished prose immediately
// 3. **REMOVE SPEECH ARTIFACTS**: Strip "um", "uh", "like", false starts, repetitions, and verbal filler
// 4. **MAINTAIN FLOW**: Never restart or summarize - just continue the narrative forward
// 5. **PRESERVE MEANING**: Keep all important information, examples, and explanations from the new transcription
// 6. **NATURAL TRANSITIONS**: If topic shifts, use smooth transitions ("Now,", "Next,", "Moving on to...")
// 7. **CONSISTENT VOICE**: Match the tone, style, and first-person perspective of previous script
// 8. **NO META-TEXT**: Don't add "[continuing...]", "[new topic]", or any formatting - just the lecture content

// CRITICAL:
// - Output ONLY the new polished segment that continues from previousScript
// - Do NOT repeat or rewrite previousScript
// - Do NOT summarize what came before
// - Think of this as adding the next paragraph to an ongoing document
// - Keep pacing similar to original (don't over-compress or over-expand)

// Return the next segment of polished lecture script:`,
