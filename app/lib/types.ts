/**
 * Types for the AI Lecturer Translator
 * Supports chunked, streaming audio processing
 */

export interface AudioChunk {
  id: string;
  audioData: Buffer;
  timestamp: number;
  duration: number; // in milliseconds
  status: ChunkStatus;
}

export type ChunkStatus =
  | "pending" // waiting to be processed
  | "transcribing" // converting speech to text
  | "translating" // AI improving the text
  | "synthesizing" // converting back to speech
  | "complete" // fully processed
  | "error"; // failed processing

export interface TextSegment {
  id: string; // matches AudioChunk.id
  original: string; // raw transcription
  translated: string; // AI-enhanced version
  timestamp: number;
  status: ChunkStatus;
}

export interface ProcessingQueue {
  chunks: AudioChunk[];
  segments: TextSegment[];
  currentIndex: number; // which chunk is being processed
}

export interface AudioConfig {
  chunkDurationMs: number; // default: 5000-10000 (5-10 seconds)
  sampleRate: number; // default: 16000 or 44100
  channels: number; // default: 1 (mono)
}

export interface AppState {
  isListening: boolean;
  isProcessing: boolean;
  queue: ProcessingQueue;
  config: AudioConfig;
  error?: string;
}
