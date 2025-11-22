import { FishAudioClient } from "fish-audio";
import { writeFile } from "fs/promises";
import {fishAudio } from "./fish-auth";
// Initialize session
// const audio = await fishAudio.textToSpeech.convert({
//     text: "Hello, world!",
//     reference_id: "your_voice_model_id",
// });

// const buffer = Buffer.from(await new Response(audio).arrayBuffer());
// await writeFile("output.mp3", buffer);

// console.log("✓ Audio saved to output.mp3");


export async function generateSpeechMp3(
    text: string,
    voiceModelId: string,
    outputPath: string
) {
    try {
        // Call FishAudio API
        const audio = await fishAudio.textToSpeech.convert({
            text,
            reference_id: voiceModelId,
            format: "s1"        // ensure MP3 output
        });

        // Convert API Response → Buffer
        const buffer = Buffer.from(await new Response(audio).arrayBuffer());

        // Save to file
        await writeFile(outputPath, buffer);

        console.log(`✓ Audio saved to ${outputPath}`);
    } catch (err) {
        console.error("❌ Error generating MP3 audio:", err);
        throw err;
    }
}
