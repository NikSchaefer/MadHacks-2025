import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ConfettiToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export function ConfettiToggle({ enabled, onToggle }: ConfettiToggleProps) {
    return (
        <div className="absolute top-4 right-4 flex items-center gap-2">
            <Label htmlFor="confetti-switch" className="text-sm font-medium">
                🎉
            </Label>
            <Switch
                id="confetti-switch"
                checked={enabled}
                onCheckedChange={onToggle}
            />
        </div>
    );
}

