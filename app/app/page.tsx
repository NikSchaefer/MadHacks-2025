"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextSegment } from "@/lib/types";
import { DEFAULT_CONFIG } from "@/lib/config";
import { createAudioController, AudioController } from "@/lib/audio-controller";

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const controllerRef = useRef<AudioController | null>(null);

  const getController = useCallback(() => {
    if (!controllerRef.current) {
      controllerRef.current = createAudioController(DEFAULT_CONFIG, {
        onSegmentComplete: (segment) => {
          setSegments((prev) => [...prev, segment]);
        },
        onError: (error) => {
          console.error("Audio processing error:", error);
          setStatusMessage(`Error: ${error.message}`);
        },
        onStatusChange: (status) => {
          setStatusMessage(status);
        },
      });
    }
    return controllerRef.current;
  }, []);

  const toggleListening = async () => {
    const controller = getController();

    if (!isListening) {
      // Start listening
      try {
        setSegments([]); // Clear previous session
        setStatusMessage("Starting...");
        await controller.start();
        setIsListening(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
        setStatusMessage(`Failed to start: ${(error as Error).message}`);
      }
    } else {
      // Stop listening
      controller.stop();
      setIsListening(false);
      setStatusMessage("Stopped");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-6xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">AI Lecturer Translator</h1>
          <p className="text-muted-foreground text-lg">
            Transforming bad lectures into great ones, in real-time
          </p>
        </div>

        {/* Control Button */}
        <div className="flex justify-center">
          <Button
            onClick={toggleListening}
            size="lg"
            variant={isListening ? "destructive" : "default"}
            className="text-lg px-8 py-6"
          >
            {isListening ? "⏹ Stop Listening" : "🎤 Start Listening"}
          </Button>
        </div>

        {/* Status Indicator */}
        {isListening && (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <div className="size-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium">Listening...</span>
            </div>
            {statusMessage && (
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            )}
          </div>
        )}

        {/* Display Areas */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Original Text */}
          <Card>
            <CardHeader>
              <CardTitle>Original Lecture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground whitespace-pre-wrap min-h-[300px] max-h-[500px] overflow-y-auto">
                {segments.length === 0 ? (
                  <span className="text-muted-foreground/50">
                    Waiting for audio...
                  </span>
                ) : (
                  segments.map((segment) => (
                    <span
                      key={segment.id}
                      className={`inline ${
                        segment.status === "complete"
                          ? "opacity-100"
                          : "opacity-50"
                      }`}
                    >
                      {segment.original}{" "}
                    </span>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Translated Text */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">
                AI Enhanced Lecture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap min-h-[300px] max-h-[500px] overflow-y-auto">
                {segments.length === 0 ? (
                  <span className="text-muted-foreground/50">
                    Enhanced version will appear here...
                  </span>
                ) : (
                  segments.map((segment) => (
                    <span
                      key={segment.id}
                      className={`inline ${
                        segment.status === "complete"
                          ? "opacity-100"
                          : segment.status === "error"
                          ? "text-destructive opacity-70"
                          : "opacity-40 animate-pulse"
                      }`}
                    >
                      {segment.translated || "..."}{" "}
                    </span>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
