import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
console.log(apiKey)

async function prompt(textChunk: string) {
    const result = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: `Given this text, create a better and more concise summary for whatever is being explained: ${textChunk}`,
    })
    console.log(result.text)
}

prompt("Linear algebra is basically just really fancy arithmetic with arrows. You take numbers, but then you stretch them into long noodles called vectors, and then you poke those noodles with matrices, which are like extremely strict spreadsheets that insist on multiplying everything whether it makes sense or not.")