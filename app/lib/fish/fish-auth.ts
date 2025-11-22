import { FishAudioClient } from "fish-audio";
import {RealtimeEvents } from "fish-audio";

export const fishAudio = new FishAudioClient({
  apiKey: process.env.FISH_AUDIO_API_KEY,
});
