import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { cn } from "@/lib/utils";

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
    const [audioMode, setAudioMode] = useState<"original" | "ai">("original");

    // Default to the first voice if none selected
    const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);

    // We also want to track if we are "in demo mode" generally, even after processing finishes,
    // so the toggle stays available until the user explicitly stops/resets.
    const [isDemoActive, setIsDemoActive] = useState(false);

    useEffect(() => {
        // Poll for processing state
        const interval = setInterval(() => {
            const processing = controller.getIsProcessingFile
                ? controller.getIsProcessingFile()
                : false;
            if (processing !== isProcessingDemo) {
                setIsProcessingDemo(processing);
            }
            // If processing starts, ensure demo is active
            if (processing) setIsDemoActive(true);
        }, 100);
        return () => clearInterval(interval);
    }, [controller, isProcessingDemo]);

    // Set initial voice on mount
    useEffect(() => {
        controller.setPersona(selectedVoice);
    }, []); // Run once

    async function useDemoLecture() {
        const DEMO_FILE = "/physics2.mp3";
        try {
            // Start transitions immediately
            setIsProcessingDemo(true);
            setIsDemoActive(true);

            // Background fetch to keep UI snappy
            const response = await fetch(DEMO_FILE);
            const blob = await response.blob();

            await controller.playBackgroundAudio(blob);
            setAudioMode("original");
            controller.setAudioMode("original");

            const file = new File([blob], "florian2.mp3", {
                type: "audio/mpeg",
            });
            controller.processFile(file);
        } catch (error) {
            console.error("Failed to load demo lecture:", error);
        }
    }

    function stopDemo() {
        setIsDemoActive(false);
        // Reset audio mode
        setAudioMode("original");
        controller.setAudioMode("original");
        // Trigger the parent toggle which stops everything
        onToggleListening();
    }

    const hasContent =
        controller.getFullTranscript().length > 0 ||
        controller.getFullScript().length > 0;

    const handleModeToggle = (checked: boolean) => {
        const newMode = checked ? "ai" : "original";
        setAudioMode(newMode);
        controller.setAudioMode(newMode);
    };

    const handleVoiceChange = (value: string) => {
        setSelectedVoice(value);
        controller.setPersona(value);
    };

    // Show demo controls if processing OR if we've flagged demo as active
    const showDemoControls = isProcessingDemo || isDemoActive;

    return (
        <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto w-full">
            <div className="flex gap-4 w-full">
                <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                    <SelectTrigger
                        className={cn(
                            "h-12! text-lg flex-1 transition-all duration-500",
                            // When in AI mode during demo, highlight this dropdown to show it controls the output
                            showDemoControls && audioMode === "ai"
                                ? "border-primary ring-2 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)] scale-[1.02]"
                                : ""
                        )}
                    >
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

            {/* Main Control Area */}
            <div className="relative w-full h-16">
                {/* Default: Record Button */}
                <div
                    className={cn(
                        "absolute inset-0 transition-all duration-500 ease-in-out",
                        showDemoControls
                            ? "opacity-0 pointer-events-none scale-95"
                            : "opacity-100 scale-100"
                    )}
                >
                    <Button
                        onClick={onToggleListening}
                        size="lg"
                        variant={isListening ? "destructive" : "default"}
                        className="w-full h-full text-xl shadow-md hover:shadow-lg"
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
                </div>

                {/* Demo: Toggle Control Bar */}
                <div
                    className={cn(
                        "absolute inset-0 transition-all duration-500 ease-in-out",
                        showDemoControls
                            ? "opacity-100 scale-100"
                            : "opacity-0 pointer-events-none scale-95"
                    )}
                >
                    <div className="flex items-center gap-3 bg-secondary/10 border border-border p-3 rounded-md w-full justify-between h-full">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2 h-10"
                            onClick={stopDemo}
                        >
                            Stop Demo
                        </Button>
                        <div className="flex items-center gap-4">
                            <Label
                                htmlFor="audio-mode"
                                className={cn(
                                    "cursor-pointer text-base transition-colors",
                                    audioMode === "original"
                                        ? "text-foreground font-bold"
                                        : "text-muted-foreground font-normal"
                                )}
                            >
                                Original
                            </Label>
                            <Switch
                                id="audio-mode"
                                checked={audioMode === "ai"}
                                onCheckedChange={handleModeToggle}
                                className="data-[state=checked]:bg-primary scale-125"
                            />
                            <Label
                                htmlFor="audio-mode"
                                className={cn(
                                    "cursor-pointer text-base transition-colors",
                                    audioMode === "ai"
                                        ? "text-primary font-bold"
                                        : "text-muted-foreground font-normal"
                                )}
                            >
                                AI Persona
                            </Label>
                        </div>
                        <div className="w-[88px]"></div>{" "}
                        {/* Spacer for centering */}
                    </div>
                </div>
            </div>

            {/* Bottom Links Area - Fixed Height to prevent jumping */}
            <div className="h-8 w-full flex justify-center items-center relative">
                <div
                    className={cn(
                        "transition-opacity duration-300 absolute",
                        // Hide if demo is actively showing (either processing or held open)
                        // OR if we are recording (user busy)
                        // OR if content exists (don't show start demo link if we have results)
                        showDemoControls || isListening || hasContent
                            ? "opacity-0 pointer-events-none"
                            : "opacity-100"
                    )}
                >
                    <Button
                        variant="ghost"
                        className="text-muted-foreground bg-transparent hover:text-foreground"
                        size="sm"
                        onClick={useDemoLecture}
                    >
                        (Or use our demo lecture to get started...)
                    </Button>
                </div>

                <div
                    className={cn(
                        "transition-opacity duration-300 absolute",
                        // Only show reset if:
                        // 1. NOT in demo mode
                        // 2. NOT recording (unless you want reset while recording, usually you stop first)
                        // 3. Content exists
                        !showDemoControls && !isListening && hasContent
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none"
                    )}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive/80 text-xs hover:bg-destructive/10 hover:text-destructive"
                        onClick={onReset}
                    >
                        ↺ Reset Session
                    </Button>
                </div>
            </div>
        </div>
    );
}
