import { FishAudioClient } from "fish-audio";
import { createReadStream } from "fs";

export async function transcribeAudio(audioFilePath: string) {
  const fishAudio = new FishAudioClient({ apiKey: process.env.FISH_API_KEY });

  const result = await fishAudio.speechToText.convert({
    audio: createReadStream(audioFilePath),
  });

  // English transcription
  await fishAudio.speechToText.convert({
    audio: createReadStream(audioFilePath),
    language: "en"
  });

  console.log(result.text);
  console.log("Duration (s):", result.duration);
}