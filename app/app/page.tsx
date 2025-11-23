"use client";

import { AudioController } from "@/lib/audio-controller";
import { useState, useEffect, useRef, useMemo } from "react";
import { DEFAULT_CONFIG } from "@/lib/config";
import confetti from "canvas-confetti";
import { Header } from "@/components/Header";
import { ControlPanel } from "@/components/ControlPanel";
import { StatusIndicator } from "@/components/StatusIndicator";
import { TranscriptCards } from "@/components/TranscriptCards";
import { SlideshowSidebar } from "@/components/SlideshowSidebar";
import { ConfettiToggle } from "@/components/ConfettiToggle";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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

    const [confettiEnabled, setConfettiEnabled] = useState(true);

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

            explodeConfetti();

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

    function explodeConfetti() {
        if (!confettiEnabled) return;
        confetti({
            particleCount: 180,
            spread: 360,
            origin: { y: -0.4, x: 0.5 },
        });
    }

    // --- Conditional layout ---
    if (!slideshowFile) {
        // Centered single column layout
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-24">
                <div className="max-w-6xl w-full space-y-8">
                    <Header />

                    <ControlPanel
                        controller={controller}
                        isListening={isListening}
                        isUploading={isUploading}
                        onToggleListening={toggleListening}
                        onUploadSlideshow={uploadSlideshow}
                    />

                    <StatusIndicator
                        isListening={isListening}
                        statusMessage={statusMessage}
                    />

                    <TranscriptCards transcript={transcript} script={script} />
                </div>

                <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                <ConfettiToggle
                    enabled={confettiEnabled}
                    onToggle={setConfettiEnabled}
                />
                <div className="w-full h-1/2 relative">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1440 320"
                    >
                        <path
                            fill="#1447E6"
                            fillOpacity="1"
                            d="M0,128L60,106.7C120,85,240,43,360,37.3C480,32,600,64,720,90.7C840,117,960,139,1080,128C1200,117,1320,75,1380,53.3L1440,32L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                        ></path>
                    </svg>
                    <div className="absolute bottom-0 left-0 w-full text-center py-6">
                        <a href="https://github.com/NikSchaefer/MadHacks-2025" className="text-blue-200">Made with ❤️ in 24 hours @ MadHacks, 2025 By Nik, Ben, Henry, and Eric</a>
                    </div>
                </div>
            </div>
        );
    } else {
        // Two column layout with slideshow on right
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
                    <SlideshowSidebar
                        controller={controller}
                        isListening={isListening}
                        isUploading={isUploading}
                        statusMessage={statusMessage}
                        transcript={transcript}
                        script={script}
                        onToggleListening={toggleListening}
                        onUploadSlideshow={uploadSlideshow}
                    />

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
                <div className="absolute top-2 right-2 flex items-center gap-1">
                    <Label
                        htmlFor="confetti-switch"
                        className="text-sm font-medium"
                    >
                        🎉
                    </Label>
                    <Switch
                        id="confetti-switch"
                        checked={confettiEnabled}
                        onCheckedChange={setConfettiEnabled}
                    />
                </div>
                <div className="w-full text-center py-6 text-muted-foreground">
                    <a href="https://github.com/NikSchaefer/MadHacks-2025" className="text-blue-500">Made with ❤️ in 24 hours @ MadHacks, 2025 By Nik, Ben, Henry, and Eric</a>
                </div>
            </div>
        );
    }
}
