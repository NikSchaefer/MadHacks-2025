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
import { WaveBackground } from "@/components/WaveBackground";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import Image from "next/image";

export default function Home() {
    const [controller] = useState(() => new AudioController(DEFAULT_CONFIG));
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
    const [isListening, setIsListening] = useState(false);

    // Poll for transcript and script updates
    useEffect(() => {
        const interval = setInterval(() => {
            setTranscript(controller.getFullTranscript());
            setScript(controller.getFullScript());
            setIsListening(controller.getIsRecording());
        }, 100); // Update every 100ms

        return () => clearInterval(interval);
    }, [controller]);

    function toggleListening() {
        // If processing demo, stop it
        // We need a way to check if processing file, but controller handles stopRecording smartly now
        if (
            isListening ||
            (controller.getIsProcessingFile && controller.getIsProcessingFile())
        ) {
            controller.stopRecording();
            // We don't strictly set isListening false here because controller state might lag slightly
            // but UI updates via poll. However, for immediate feedback:
            setStatusMessage("Stopped");
            explodeConfetti();
            return;
        }
        controller.startRecording();
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

    function handleReset() {
        controller.reset();
        setTranscript("");
        setScript("");
        setStatusMessage("");
    }

    // const isListening = controller.getIsRecording(); // Moved to state for smoother UI

    // --- Conditional layout ---
    if (!slideshowFile) {
        // Centered single column layout
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-24">
                <div className="max-w-6xl w-full space-y-8 relative z-50">
                    <Header />

                    <ControlPanel
                        controller={controller}
                        isListening={isListening}
                        isUploading={isUploading}
                        onToggleListening={toggleListening}
                        onUploadSlideshow={uploadSlideshow}
                        onReset={handleReset}
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
                <div className="absolute top-6 left-6 z-50">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={100}
                        height={100}
                        className="rounded-xl"
                    />
                </div>
                <WaveBackground />
            </div>
        );
    } else {
        // Two column layout with slideshow on right
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                <div className="w-full space-y-8 flex gap-6 p-8 relative z-50">
                    <SlideshowSidebar
                        controller={controller}
                        isListening={isListening}
                        isUploading={isUploading}
                        statusMessage={statusMessage}
                        transcript={transcript}
                        script={script}
                        onToggleListening={toggleListening}
                        onUploadSlideshow={uploadSlideshow}
                        onReset={handleReset}
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
                {/* <div className="absolute top-2 right-2 flex items-center gap-1">
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
                    
                {/* <ConfettiToggle
                    enabled={confettiEnabled}
                    onToggle={setConfettiEnabled}
                /> */}
                {/* </div> */} 
                <div className="absolute top-3 left-3 z-50">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={70}
                        height={65}
                        className="rounded-xl shadow-lg"
                    />
                </div>
                <WaveBackground />
            </div>
        );
    }
}
