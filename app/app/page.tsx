"use client";

import { Button } from "@/components/ui/button";
import { AudioController } from "@/lib/audio-controller";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_CONFIG } from "@/lib/config";

export default function Home() {
    const controller = new AudioController(DEFAULT_CONFIG);
    const isListening = controller.getIsRecording();
    const [statusMessage, setStatusMessage] = useState("");

    function toggleListening() {
        if (controller.getIsRecording()) {
            controller.stopRecording();
            setStatusMessage("Stopped");
            return;
        }
        controller.startRecording();
        setStatusMessage("Listening...");
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="max-w-6xl w-full space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold">
                        AI Lecturer Translator
                    </h1>
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
                        {isListening
                            ? "⏹ Stop Listening"
                            : "🎤 Start Listening"}
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
                            <p className="text-sm text-muted-foreground">
                                {statusMessage}
                            </p>
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
                                {controller.getFullTranscript().length === 0 ? (
                                    <span className="text-muted-foreground/50">
                                        Waiting for audio...
                                    </span>
                                ) : (
                                    controller.getFullTranscript()
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
                                {controller.getFullScript().length === 0 ? (
                                    <span className="text-muted-foreground/50">
                                        Enhanced version will appear here...
                                    </span>
                                ) : (
                                    controller.getFullScript()
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
