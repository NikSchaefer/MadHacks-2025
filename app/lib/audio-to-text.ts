import { FishAudioClient } from "fish-audio";
import { createReadStream } from "fs";

const fishAudio = new FishAudioClient({ apiKey: process.env.FISH_API_KEY });

const result = await fishAudio.speechToText.convert({
  audio: createReadStream("test-audio.mp3"),
  language : "en"
});

console.log(result.text);
console.log("Duration (s):", result.duration);

// import { FishAudioClient } from "fish-audio";
// import { readFile } from "fs/promises";


// export async function transcribeAudio(audioFilePath: string) {
//   const fishAudio = new FishAudioClient({ apiKey: process.env.FISH_API_KEY });
//     const audioFile = await readFile(audioFilePath);

//   const result = await fishAudio.speechToText.convert({
//     audio: audioFile,
//   });

//   // English transcription
//   await fishAudio.speechToText.convert({
//     audio: audioFile,
//     language: "en"
//   });

//   console.log(result.text);
//   console.log("Duration (s):", result.duration);
// }