import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { VOICES } from "@/data/voices";
import { AudioController } from "@/lib/audio-controller";
import { useState, useEffect } from "react";

interface ControlPanelProps {
    controller: AudioController;
    isListening: boolean;
    isUploading: boolean;
    onToggleListening: () => void;
    onUploadSlideshow: () => void;
    onReset: () => void;
}

export function ControlPanel({
    controller,
    isListening,
    isUploading,
    onToggleListening,
    onUploadSlideshow,
    onReset,
}: ControlPanelProps) {
    const [isProcessingDemo, setIsProcessingDemo] = useState(false);

    useEffect(() => {
        // Poll for processing state
        const interval = setInterval(() => {
            // We need to cast to any or update the interface if we want full type safety
            // but since we just added the method, this is a quick fix for the UI
            if (
                controller.getIsProcessingFile &&
                controller.getIsProcessingFile() !== isProcessingDemo
            ) {
                setIsProcessingDemo(controller.getIsProcessingFile());
            }
        }, 100);
        return () => clearInterval(interval);
    }, [controller, isProcessingDemo]);

    async function useDemoLecture() {
        try {
            setIsProcessingDemo(true);
            const response = await fetch("/florian1.mp3");
            const blob = await response.blob();
            const file = new File([blob], "florian1.mp3", {
                type: "audio/mpeg",
            });
            controller.processFile(file);
        } catch (error) {
            console.error("Failed to load demo lecture:", error);
        }
    }

    const hasContent =
        controller.getFullTranscript().length > 0 ||
        controller.getFullScript().length > 0;

    return (
        <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto w-full">
            <div className="flex gap-4 w-full">
                <Select onValueChange={controller.setPersona}>
                    <SelectTrigger className="h-12! text-lg flex-1">
                        <SelectValue placeholder="Select Voice Persona" />
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
                variant={
                    isListening || isProcessingDemo ? "destructive" : "default"
                }
                className="w-full h-16 text-xl shadow-md transition-all hover:shadow-lg"
            >
                {isListening || isProcessingDemo ? (
                    <span className="flex items-center gap-2">
                        <span className="animate-pulse">●</span>{" "}
                        {isProcessingDemo
                            ? "Stop Processing Demo"
                            : "Stop Recording"}
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        🎤 Start Lecture Translation
                    </span>
                )}
            </Button>

            <div className="flex gap-4 justify-center w-full">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground text-xs hover:bg-transparent hover:text-foreground"
                    onClick={useDemoLecture}
                >
                    (Or use our demo lecture to get started)
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
        </div>
    );
}
