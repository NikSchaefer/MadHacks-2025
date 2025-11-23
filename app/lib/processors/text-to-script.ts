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

    const result = await generateText({
        model: google("gemini-2.5-flash-lite"),
        prompt: `You are a college professor.  reword this lecture script to be concise, by trying not to repeat yourself. Use transition words between topics. Limit responses to 1 sentence.  

Here is your persona:
"""
${systemPersona}
"""

Our already transcribed text to be appended: 
"""
${safePreviousScript || "[No previous context]"}
"""

New text to transcribe and then append:
"""
${newText || "[No new text]"}
"""

INSTRUCTIONS:
- Output ONLY the new polished segment that continues from previousScript
- **IMPORTANT**: If the text doesn't make sense or needs more context, you can return nothing to skip and wait for the next text before speaking.
- This will be converted to speech and streamed in real-time, so quality and continuity are critical.
- Remove "um", "uh", "like", false starts, repetitions, and verbal filler
- Do NOT repeat or rewrite previousScript
- Never restart or summarize - just continue the narrative forward - Think of this as adding the next paragraph to an ongoing document
- Keep pacing similar to original (don't over-compress or over-expand)
- Do not add any meta-text like "[continuing...]", "[new topic]", or any formatting - just the lecture content

Return the next segment of polished lecture script:
`,
    });

    return result.text;
}
