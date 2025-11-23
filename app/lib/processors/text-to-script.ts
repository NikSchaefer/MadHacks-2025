import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function textToScript({
    previousText,
    newText,
    previousScript,
}: {
    previousText: string;
    newText: string;
    previousScript: string;
}) {
    if (!newText) {
        throw new Error("Missing new text");
    }

    const result = await generateText({
        model: google("gemini-2.5-flash-lite"),
        prompt: `You are a real-time lecture enhancement AI. You're processing a LIVE lecture stream, continuously transforming raw transcription into polished educational content that flows naturally as one continuous narrative.

CURRENT STATE:
Previous script (what you've already generated from the previous transcription segments): 
"""
${previousScript}
"""

NEW RAW TRANSCRIPTION (just captured):
"""
${newText}
"""

RECENT RAW CONTEXT (for reference only):
"""
${previousText || "[No previous context]"}
"""

YOUR TASK:
Continue the polished lecture script by transforming ONLY the new transcription segment. This will be converted to speech and streamed in real-time, so quality and continuity are critical.

REQUIREMENTS:

1. **SEAMLESS CONTINUATION**: The output must flow naturally from where previousScript ended - pick up mid-sentence if needed
2. **REAL-TIME OPTIMIZATION**: Be fast and decisive - convert raw speech to polished prose immediately
3. **REMOVE SPEECH ARTIFACTS**: Strip "um", "uh", "like", false starts, repetitions, and verbal filler
4. **MAINTAIN FLOW**: Never restart or summarize - just continue the narrative forward
5. **PRESERVE MEANING**: Keep all important information, examples, and explanations from the new transcription
6. **NATURAL TRANSITIONS**: If topic shifts, use smooth transitions ("Now,", "Next,", "Moving on to...")
7. **CONSISTENT VOICE**: Match the tone, style, and first-person perspective of previous script
8. **NO META-TEXT**: Don't add "[continuing...]", "[new topic]", or any formatting - just the lecture content

CRITICAL: 
- Output ONLY the new polished segment that continues from previousScript
- Do NOT repeat or rewrite previousScript
- Do NOT summarize what came before
- Think of this as adding the next paragraph to an ongoing document
- Keep pacing similar to original (don't over-compress or over-expand)

Return the next segment of polished lecture script:`,
    });

    return result.text;
}