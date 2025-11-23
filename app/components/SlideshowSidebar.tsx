import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VOICES } from "@/data/voices";
import { AudioController } from "@/lib/audio-controller";
import Image from "next/image";

interface SlideshowSidebarProps {
    controller: AudioController;
    isListening: boolean;
    isUploading: boolean;
    statusMessage: string;
    transcript: string;
    script: string;
    onToggleListening: () => void;
    onUploadSlideshow: () => void;
    onReset: () => void;
}

export function SlideshowSidebar({
    controller,
    isListening,
    isUploading,
    statusMessage,
    transcript,
    script,
    onToggleListening,
    onUploadSlideshow,
    onReset,
}: SlideshowSidebarProps) {
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const scriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [transcript]);

    useEffect(() => {
        scriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [script]);

    const hasContent = transcript.length > 0 || script.length > 0;

    return (
        <div className="w-1/3 flex flex-col gap-6">
            {/* Header */}
            <div className="text-left space-y-2">
                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={70}
                    height={65}
                    className="rounded-xl shadow-lg"
                />
                <h1 className="text-4xl font-bold">MadLectures</h1>
                <p className="text-muted-foreground text-lg">
                    Transforming bad lectures into great ones, in real-time
                </p>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col gap-4 w-full">
                <div className="flex gap-4 w-full">
                    <Select onValueChange={controller.setPersona}>
                        <SelectTrigger className="h-12! text-lg flex-1">
                            <SelectValue placeholder="Select Voice" />
                        </SelectTrigger>
                        <SelectContent>
                            {VOICES.map((voice) => (
                                <SelectItem key={voice.id} value={voice.id}>
                                    {voice.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={onUploadSlideshow}
                        size="lg"
                        variant={isUploading ? "secondary" : "outline"}
                        className="h-12 px-6 text-lg flex-1"
                    >
                        📁 {isUploading ? "Slides Uploaded" : "Upload Slides"}
                    </Button>
                </div>

                <Button
                    onClick={onToggleListening}
                    size="lg"
                    variant={isListening ? "destructive" : "default"}
                    className="w-full h-16 text-xl shadow-md transition-all hover:shadow-lg"
                >
                    {isListening ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-pulse">●</span> Stop
                            Recording
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            🎤 Start Lecture Translation
                        </span>
                    )}
                </Button>

                {hasContent && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive/80 text-xs hover:bg-destructive/10 hover:text-destructive"
                        onClick={onReset}
                    >
                        ↺ Reset Session
                    </Button>
                )}
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

            {/* Original Text */}
            <Card className="border-primary/20 bg-white py-0">
                <div className="py-6 h-full w-full">
                    <CardHeader>
                        <CardTitle>Original Lecture</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground whitespace-pre-wrap min-h-[150px] max-h-[500px] overflow-y-auto pr-2">
                            {transcript.length === 0 ? (
                                <span className="text-muted-foreground/50">
                                    Waiting for audio...
                                </span>
                            ) : (
                                <>
                                    {transcript}
                                    <div ref={transcriptEndRef} />
                                </>
                            )}
                        </div>
                    </CardContent>
                </div>
            </Card>

            {/* Enhanced Text */}
            <Card className="border-primary/20 bg-white py-0">
                <div className="py-6 h-full w-full bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-primary">
                            AI Enhanced Lecture
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="whitespace-pre-wrap min-h-[150px] max-h-[500px] overflow-y-auto pr-2">
                            {script.length === 0 ? (
                                <span className="text-muted-foreground/50">
                                    Enhanced version will appear here...
                                </span>
                            ) : (
                                <>
                                    {script}
                                    <div ref={scriptEndRef} />
                                </>
                            )}
                        </div>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
