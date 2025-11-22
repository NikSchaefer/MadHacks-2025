import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function textToScript(text: string): Promise<string> {
    const { text: enhanced } = await generateText({
        model: openai("gpt-4o"),
        prompt: `You are an expert lecturer. Improve this transcribed lecture segment to be clearer, more engaging, and better structured. Fix transcription errors and make it sound professional.

Original: "${text}"

Return only the improved version, no explanations.`,
    });

    return enhanced;
}
