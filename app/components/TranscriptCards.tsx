import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TranscriptCardsProps {
    transcript: string;
    script: string;
}

export function TranscriptCards({ transcript, script }: TranscriptCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Original Text */}
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Original Lecture</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="text-muted-foreground wrap min-h-[300px] max-h-[500px] overflow-y-auto h-full">
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

            {/* Translated Text */}
            <Card className="border-primary/20 bg-primary/5 h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="text-primary">
                        AI Enhanced Lecture
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="whitespace-pre-wrap min-h-[300px] max-h-[500px] overflow-y-auto h-full">
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

