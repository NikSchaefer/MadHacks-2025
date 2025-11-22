import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

function textToScript(text: string) {}

const { text } = await generateText({
  model: openai("gpt-5"),
  prompt: "What is love?",
});
