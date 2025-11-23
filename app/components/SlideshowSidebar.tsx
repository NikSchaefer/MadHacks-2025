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

interface SlideshowSidebarProps {
    controller: AudioController;
    isListening: boolean;
    isUploading: boolean;
    statusMessage: string;
    transcript: string;
    script: string;
    onToggleListening: () => void;
    onUploadSlideshow: () => void;
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
}: SlideshowSidebarProps) {
    return (
        <div className="w-1/3 flex flex-col gap-6">
            {/* Header */}
            <div className="text-left space-y-2">
                <h1 className="text-4xl font-bold">AI Lecturer Translator</h1>
                <p className="text-muted-foreground text-lg">
                    Transforming bad lectures into great ones, in real-time
                </p>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-left gap-4">
                <Button
                    onClick={onToggleListening}
                    size="lg"
                    variant={isListening ? "destructive" : "default"}
                    className="text-lg w-1/9 px-7 py-6"
                >
                    {isListening ? "⏹" : "👂"}
                </Button>

                <Button
                    onClick={onUploadSlideshow}
                    size="lg"
                    variant={isUploading ? "destructive" : "default"}
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
                            <SelectItem key={voice.id} value={voice.id}>
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
    );
}

