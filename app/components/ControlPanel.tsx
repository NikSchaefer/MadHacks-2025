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

interface ControlPanelProps {
    controller: AudioController;
    isListening: boolean;
    isUploading: boolean;
    onToggleListening: () => void;
    onUploadSlideshow: () => void;
}

export function ControlPanel({
    controller,
    isListening,
    isUploading,
    onToggleListening,
    onUploadSlideshow,
}: ControlPanelProps) {
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
                variant={isListening ? "destructive" : "default"}
                className="w-full h-16 text-xl shadow-md transition-all hover:shadow-lg"
            >
                {isListening ? (
                    <span className="flex items-center gap-2">
                        <span className="animate-pulse">●</span> Stop Recording
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        🎤 Start Lecture Translation
                    </span>
                )}
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs hover:bg-transparent hover:text-foreground"
            >
                (Or use our demo lecture to get started)
            </Button>
        </div>
    );
}
