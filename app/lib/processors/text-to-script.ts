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

    // Limit previousScript context to avoid token limits and crashes
    // Keep roughly last 1000 chars (approx 200-250 words) for continuity
    const contextLimit = 1000;
    const safePreviousScript = previousScript.slice(-contextLimit);
    const safePreviousText = previousText.slice(-contextLimit);

    const result = await generateText({
        model: google("gemini-2.5-flash-lite"),
        prompt: `You are an expert speaker polishing a raw transcript for a live lecture.
Your goal is to make the script cohesive, explanatory, and easy to listen to.

Here is your persona:
"""
${systemPersona}
"""

CONTEXT - The raw text we have ALREADY processed:
"""
${safePreviousText || "[No previous text context]"}
"""

CONTEXT - The script we ALREADY generated from that text: 
"""
${safePreviousScript || "[No previous script context]"}
"""

NEW INPUT - New text to transcribe and append:
"""
${newText || "[No new text]"}
"""

INSTRUCTIONS:
- Output ONLY the new polished segment that continues from the previous script.
- **IMPORTANT**: Check the "NEW INPUT" against "CONTEXT - Raw text". If the new input overlaps with what was already processed, IGNORE the overlapping part.
- **CRITICAL**: Check the "CONTEXT - Generated script". DO NOT repeat any information, phrases, or topics that are already in the generated script.
- Fix grammar, remove repetition, and clarify muddled sentences to make them more explanatory.
- NEVER USE ASTERISKS or BACKTICKS. They can't be spoken by the voice very well
- Maintain the speaker's original intent and narrative flow. Do not summarize; rewrite it as a better version of the speech.
- Use natural connections between ideas instead of heavy-handed transition words like "Furthermore" or "Indeed".
- If the raw text is fragmented, reconstruct it into complete, logical sentences.
- Keep the tone engaging and professional.

Return the next segment of polished lecture script:
`,
    });

    return result.text.replaceAll("*", "").replaceAll("`", ""); // Remove asterisks and backticks
}
