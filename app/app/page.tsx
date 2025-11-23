"use client";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AudioController } from "@/lib/audio-controller";
import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_CONFIG } from "@/lib/config";
import { VOICES } from "@/data/voices";

export default function Home() {
    const [controller] = useState(() => new AudioController(DEFAULT_CONFIG));
    const [isListening, setIsListening] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [transcript, setTranscript] = useState("");
    const [script, setScript] = useState("");
    const [slideshowFile, setSlideshowFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfUrl = useMemo(() => {
        if (!slideshowFile) return "";
        return URL.createObjectURL(slideshowFile);
    }, [slideshowFile]);

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

    // --- Conditional layout ---
    if (!slideshowFile) {
        //centered single column layout
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <div className="max-w-6xl w-full space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold">
                            AI Lecturer Translator
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Transforming bad lectures into great ones, in
                            real-time
                        </p>
                    </div>

                    {/* Control Button */}
                    <div className="flex justify-center gap-6">
                        <Button
                            onClick={toggleListening}
                            size="lg"
                            variant={isListening ? "destructive" : "default"}
                            className="text-lg px-8 w-1/6 py-6"
                        >
                            {isListening
                                ? "⏹ Stop Listening"
                                : "🎤 Start Listening"}
                        </Button>

                        <Button
                            onClick={uploadSlideshow}
                            size="lg"
                            variant={isUploading ? "destructive" : "default"}
                            className="text-lg px-8 w-1/6 py-6"
                        >
                            📁 Upload file
                        </Button>
                        <Select onValueChange={controller.setPersona}>
                            <SelectTrigger className="text-lg px-8 w-1/6 py-6">
                                <SelectValue placeholder="Voice" />
                            </SelectTrigger>
                            <SelectContent>
                                {VOICES.map((voice) => (
                                    <SelectItem key={voice.id} value={voice.id}>
                                        {voice.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Indicator */}
                    {isListening && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <div className="size-3 bg-green-500 rounded-full animate-pulse" />
                                <span className="font-medium">
                                    Listening...
                                </span>
                            </div>
                            {statusMessage && (
                                <p className="text-sm text-muted-foreground">
                                    {statusMessage}
                                </p>
                            )}
                        </div>
                    )}

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

                <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        );
    } else {
        //two column layout with slideshow on right
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                <div className="w-full space-y-8 flex gap-6">
                    <div className="w-1/3 flex flex-col gap-6">
                        {/* Header */}
                        <div className="text-left space-y-2">
                            <h1 className="text-4xl font-bold">
                                AI Lecturer Translator
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Transforming bad lectures into great ones, in
                                real-time
                            </p>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex justify-left gap-4">
                            <Button
                                onClick={toggleListening}
                                size="lg"
                                variant={
                                    isListening ? "destructive" : "default"
                                }
                                className="text-lg w-1/9 px-7 py-6"
                            >
                                {isListening ? "⏹" : "👂"}
                            </Button>

                            <Button
                                onClick={uploadSlideshow}
                                size="lg"
                                variant={
                                    isUploading ? "destructive" : "default"
                                }
                                className="text-lg w-1/3 px-8 py-6"
                            >
                                📁 Upload file
                            </Button>

                            <Select onValueChange={controller.setPersona}>
                                <SelectTrigger className="text-lg w-1/2 px-8 py-6">
                                    <SelectValue placeholder="Voice" />
                                </SelectTrigger>
                                <SelectContent>
                                    {VOICES.map((voice) => (
                                        <SelectItem
                                            key={voice.id}
                                            value={voice.id}
                                        >
                                            {voice.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Indicator */}
                        {isListening && (
                            <div className="flex flex-col items-left gap-2">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <div className="size-3 bg-green-500 rounded-full animate-pulse" />
                                    <span className="font-medium">
                                        Listening...
                                    </span>
                                </div>
                                {statusMessage && (
                                    <p className="text-sm text-muted-foreground">
                                        {statusMessage}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Original Text */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Original Lecture</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-muted-foreground whitespace-pre-wrap min-h-[150px] max-h-[500px] overflow-y-auto">
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

                        {/* Enhanced Text */}
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-primary">
                                    AI Enhanced Lecture
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="whitespace-pre-wrap min-h-[150px] max-h-[500px] overflow-y-auto">
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

                    {/* Slideshow */}
                    <div className="w-2/3">
                        <iframe
                            src={pdfUrl}
                            width="100%"
                            height="100%"
                            className="rounded-lg shadow w-full"
                        />
                    </div>
                </div>
            </div>
        );
    }
}
