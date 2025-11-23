import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TranscriptCardsProps {
    transcript: string;
    script: string;
}

export function TranscriptCards({ transcript, script }: TranscriptCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Original Text */}
            <Card className="h-full flex flex-col z-50 p-0">
                <div className="py-6 h-full w-full">
                    <CardHeader>
                        <CardTitle>Original Lecture</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="text-muted-foreground wrap h-[300px] overflow-y-auto pr-2">
                            {transcript.length === 0 ? (
                                <span className="text-muted-foreground/50">
                                    Waiting for audio...
                                </span>
                            ) : (
                                transcript
                            )}
                        </div>
                    </CardContent>
                </div>
            </Card>

            {/* Translated Text */}
            <Card className="border-primary/20 p-0 bg-white h-full flex flex-col z-50">
                <div className="bg-primary/5 py-6 h-full w-full">
                    <CardHeader>
                        <CardTitle className="text-primary">
                            AI Enhanced Lecture
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="whitespace-pre-wrap h-[300px] overflow-y-auto pr-2">
                            {script.length === 0 ? (
                                <span className="text-muted-foreground/50">
                                    Enhanced version will appear here...
                                </span>
                            ) : (
                                script
                            )}
                        </div>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
