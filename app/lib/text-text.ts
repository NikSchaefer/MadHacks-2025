import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
console.log(apiKey);

async function prompt(rawText: String) {
    const result = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: `Given that this text (${rawText}) is a segment of text from a transcribed lecture,
            generate a concise and more effective summary of the given topic that is being explained in that text.
            Make sure that you are building upon and using the text that you have previously generated from the 
            last transcribed segments of the lecture.` 
    })
    return result.text;
}