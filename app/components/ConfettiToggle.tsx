import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ConfettiToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    onManualTrigger?: () => void;
    className?: string;
}

export function ConfettiToggle({
    enabled,
    onToggle,
    onManualTrigger,
    className,
}: ConfettiToggleProps) {
    return (
        <div
            className={cn(
                "absolute flex items-center gap-2 z-[100]",
                className || "top-4 right-4"
            )}
        >
            <Label
                htmlFor="confetti-switch"
                className="text-sm font-medium cursor-pointer select-none hover:scale-110 transition-transform"
                onClick={(e) => {
                    e.preventDefault(); // Prevent label from toggling the switch if that's default behavior for label for=
                    onManualTrigger?.();
                }}
            >
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
