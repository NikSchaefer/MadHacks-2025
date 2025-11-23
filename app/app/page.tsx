"use client";

import { Button } from "@/components/ui/button";
import { AudioController } from "@/lib/audio-controller";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_CONFIG } from "@/lib/config";

export default function Home() {
    const [controller] = useState(() => new AudioController(DEFAULT_CONFIG));
    const [isListening, setIsListening] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [transcript, setTranscript] = useState("");
    const [script, setScript] = useState("");
    const [slideshowFile, setSlideshowFile] = useState<File | null>(null); // store file
    const fileInputRef = useRef<HTMLInputElement>(null); // ref for hidden input

    // Poll for transcript and script updates
    useEffect(() => {
        const interval = setInterval(() => {
            setTranscript(controller.getFullTranscript());
            setScript(controller.getFullScript());
        }, 100); // Update every 100ms

        return () => clearInterval(interval);
    }, [controller]);

    function toggleListening() {
        if (isListening) {
            controller.stopRecording();
            setIsListening(false);
            setStatusMessage("Stopped");
            return;
        }
        controller.startRecording();
        setIsListening(true);
        setStatusMessage("Listening...");
    }

    function uploadSlideshow() {
        if (fileInputRef.current) {
            fileInputRef.current.click(); // open file dialog
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setSlideshowFile(file); // store uploaded file
        setIsUploading(true);
        setStatusMessage(`Selected file: ${file.name}`);
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            {/* Slideshow Input */}
            <input
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="w-full space-y-8">
                {/* Header */}
                <div className="text-left space-y-2">
                    <h1 className="text-4xl font-bold">
                        AI Lecturer Translator
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Transforming bad lectures into great ones, in real-time
                    </p>
                </div>

                {/* Control Button */}
                <div className="flex justify-left gap-6">
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

                    <Button
                        onClick={uploadSlideshow}
                        size="lg"
                        variant={isUploading ? "destructive" : "default"}
                        className="text-lg px-8 py-6"
                    >
                        📁 Upload file
                    </Button>
                </div>

                {/* Status Indicator */}
                {isListening && (
                    <div className="flex flex-col items-left gap-2">
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
                <div className="flex gap-6">
                    <div className="w-1/3 flex flex-col gap-6">
                        {/* Original Text */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Original Lecture</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-muted-foreground whitespace-pre-wrap min-h-[300px] max-h-[500px] overflow-y-auto">
                                    {transcript.length === 0 ? (
                                        <span className="text-muted-foreground/50">
                                            Waiting for audio...
                                        </span>
                                    ) : (
                                        transcript
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
                                    {script.length === 0 ? (
                                        <span className="text-muted-foreground/50">
                                            Enhanced version will appear here...
                                        </span>
                                    ) : (
                                        script
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    { /* Right half, put the slideshow here*/ }
                    <div className="w-2/3">
                        {slideshowFile ? (
                            <iframe
                                src={URL.createObjectURL(slideshowFile)}
                                width="100%"
                                height="100%"
                                className="rounded-lg shadow"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No slideshow uploaded
                            </div>
                        )}
                    </div>


                </div>
            </div>
        </div>
    );
}
