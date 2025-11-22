import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
console.log(apiKey)

async function prompt(rawText: String) {
    const result = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: `Given that this text (${rawText}) is a segment of text from a transcribed lecture,
            generate a concise and more effective summary of the given topic that is being explained in that text.
            Make sure that you are building upon and using the text that you have previously generated from the 
            last transcribed segments of the lecture. Have the returned text be created as if it is from the perspective
            of the lecturer themselves, as if the prompt is returning almost just a better version of the lecture snippet.`,
    })
    console.log(result.text);
}

prompt("Uh, okay, so, um, today we’re supposed to, you know, talk about, like, linear transformations." + 
    "So, yeah, a linear transformation is, well, it’s a function… kind of… that, um, does something with vectors." + 
    "And, uh, I mean, you’ve seen vectors before, right? So, like, you can, you know, multiply them by numbers, I think, " +
    "and then, uh, something happens… Yeah, and, um, matrices come into play, because, well, they, you know, are kind of like, " +
    "um… yeah, they help with the transformation. Anyway, so let’s just, uh… I guess we could look at an example? Maybe… no, not yet. " +
    "First, uh, definitions. Definitions are, um, important. But really, the key idea is… uh… I’ll get to it… eventually.");