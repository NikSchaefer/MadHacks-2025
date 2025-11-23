# MadLectures

Transforming bad lectures into great ones, in real-time

## Inspiration

We’ve all sat through boring lectures before, where it’s sometimes impossible to pay attention to what the professor is saying. Looking for a way to improve comprehension and save time, we created MadLectures.

## What it does

Users begin by selecting a voice that they would like to use for their lecture translation. Once selected the user can then start the lecture translation ( or just use the default voice). The lecture translation uses real time speech-to-text to create text that is then sent to Gemini Flash lite 2.5. With the use of well crafted prompt engineering, Gemini crafts a concise summary. This enhanced script is then processed by Fish Audio AI with minimal delay to give a near real time voice summary of the lecture.

## How we built it

MadLectures is built in TypeScript. We incorporated the Fish Audio API for both our text-to-speech and speech-to-text components, and we used Vercel’s TypeScript AI SDK to integrate with Gemini. Our frontend is built using React and Next.js, and is styled using Shadcn components and Tailwind CSS.

## Challenges we ran into

**Latency** - When prompting Gemini to create a concise summary of the given voice input, the varying output latency of the AI caused delays that made the user experience less fluid than we wanted. We eventually solved this by switching to the Gemini 2.5 Flash Lite model, which cut down our token usage as well as our latency by a great amount.

**Audio Processing** - When processing audio with Fish, sometimes we would run into problems in rooms with background noise or unclear audio. These would cause Fish to output broken text, which would then cause problems further down the line. We solved this problem by chunking the audio into smaller pieces so that the Fish API would be able to process the audio cleanly.

**Ballooning Prompt Size** - For our prompt to the Gemini API, we faced the problem of steadily increasing prompt size which increased latency and resource occupation. This happened because we needed to feed the previous context of the generated script to the model, which was continuously increasing. We solved this problem by experimenting with different sizes of context that were re-passed to the model, eventually finding a solid balance between previous context and performance.

## What we learned

**Generative AI** - This was the first time that most of our group members had used a generative AI API for a project, and it proved to be a great learning experience for all of us.

**Text/Speech Conversions** - Building a project based around speech proved to be quite challenging because it’s a relatively uncommon approach, but it taught us a lot about how audio is processed in modern applications.
