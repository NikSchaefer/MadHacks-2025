"use client";

import { useState, useEffect, useRef } from "react";
import { AudioRecorder as Recorder } from "@/lib/audio/recorder";
import { AudioChunk } from "@/lib/audio/types";
import { downloadAudioChunk } from "@/lib/audio/storage";

interface AudioRecorderProps {
  chunkDuration?: number; // in seconds
}

export default function AudioRecorder({
  chunkDuration = 10,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [chunks, setChunks] = useState<AudioChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<Recorder | null>(null);

  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cleanup();
      }
    };
  }, []);

  const handleChunk = (chunk: AudioChunk) => {
    setChunks((prev) => [...prev, chunk]);
    downloadAudioChunk(chunk, chunks.length);
  };

  const startRecording = async () => {
    try {
      setError(null);
      const recorder = new Recorder({
        chunkDuration: chunkDuration * 1000,
      });

      await recorder.initialize();
      recorder.start(handleChunk);
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError(
        "Failed to start recording. Please check microphone permissions."
      );
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-8 py-4 text-lg font-semibold rounded-lg transition-colors ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        {isRecording ? "Stop Recording" : "Begin Recording"}
      </button>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          Recording... (saves every {chunkDuration}s)
        </div>
      )}

      {chunks.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Saved {chunks.length} audio chunk{chunks.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
