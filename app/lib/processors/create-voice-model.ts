import { FishAudioClient } from "fish-audio";
import { createReadStream } from "fs";

const fishAudio = new FishAudioClient({ apiKey: process.env.FISH_API_KEY });

const title = "My Voice Model";
const audioFile1 = createReadStream("sample1.mp3");

// Optionally add more samples:
// const audioFile2 = createReadStream("sample2.wav");
const coverImageFile = createReadStream("cover.png"); // optional

try {
  const response = await fishAudio.voices.ivc.create({
    title,
    voices: [audioFile1],
    description: "Custom voice for storytelling",
    visibility: "private",
  });

  console.log("Voice created:", {
    id: response._id,
    title: response.title,
    state: response.state,
  });
} catch (err) {
  console.error("Create voice request failed:", err);
}
