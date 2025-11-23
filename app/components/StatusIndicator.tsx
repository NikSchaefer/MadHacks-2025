interface StatusIndicatorProps {
    isListening: boolean;
    statusMessage: string;
}

export function StatusIndicator({
    isListening,
    statusMessage,
}: StatusIndicatorProps) {
    if (!isListening) return null;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="size-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">Listening...</span>
            </div>
            {statusMessage && (
                <p className="text-sm text-muted-foreground">{statusMessage}</p>
            )}
        </div>
    );
}

