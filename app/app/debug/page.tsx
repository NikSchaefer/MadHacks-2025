"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AudioController } from "@/lib/audio-controller";
import { DEFAULT_CONFIG } from "@/lib/config";
import { VOICES } from "@/data/voices";
import { ProcessingMetric } from "@/lib/types";
import { useEffect, useState } from "react";

export default function DebugPage() {
    const [controller] = useState(() => new AudioController(DEFAULT_CONFIG));
    const [isListening, setIsListening] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [metrics, setMetrics] = useState<ProcessingMetric[]>([]);
    const [queueLength, setQueueLength] = useState(0);
    const [playbackLength, setPlaybackLength] = useState(0);
    const [transcript, setTranscript] = useState("");
    const [script, setScript] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setLogs([...controller.getLogs()]);
            setMetrics([...controller.getMetrics()]);
            setQueueLength(controller.getQueueLength());
            setPlaybackLength(controller.getPlaybackBufferLength());
            setTranscript(controller.getFullTranscript());
            setScript(controller.getFullScript());
            setIsListening(controller.getIsRecording());
        }, 200);

        return () => clearInterval(interval);
    }, [controller]);

    const toggleRecording = async () => {
        if (isListening) {
            await controller.stopRecording();
            setIsListening(false);
        } else {
            await controller.startRecording();
            setIsListening(true);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Pipeline Debugger</h1>
                    <div className="flex gap-2">
                        <Select
                            onValueChange={(val) => controller.setPersona(val)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Voice" />
                            </SelectTrigger>
                            <SelectContent>
                                {VOICES.map((voice) => (
                                    <SelectItem key={voice.id} value={voice.id}>
                                        {voice.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="relative">
                            <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                id="file-upload"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        controller.processFile(file);
                                    }
                                    // Reset input
                                    e.target.value = "";
                                }}
                            />
                            <Button
                                variant="outline"
                                onClick={() =>
                                    document
                                        .getElementById("file-upload")
                                        ?.click()
                                }
                            >
                                📁 Upload Audio File
                            </Button>
                        </div>
                        <Button
                            onClick={toggleRecording}
                            variant={isListening ? "destructive" : "default"}
                        >
                            {isListening ? "Stop Recording" : "Start Recording"}
                        </Button>
                    </div>
                </div>

                {/* Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {isListening ? "Recording" : "Idle"}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Processing Queue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {queueLength}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                chunks pending
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Playback Buffer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {playbackLength}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                chunks ready
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Avg Processing Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {metrics.length > 0
                                    ? Math.round(
                                          metrics.reduce(
                                              (acc, m) => acc + m.duration,
                                              0
                                          ) / metrics.length
                                      )
                                    : 0}
                                ms
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logs Console */}
                    <Card className="h-[500px] flex flex-col">
                        <CardHeader>
                            <CardTitle>System Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto font-mono text-xs">
                            <div className="space-y-1">
                                {logs.map((log, i) => (
                                    <div
                                        key={i}
                                        className="border-b border-slate-100 dark:border-slate-800 py-1"
                                    >
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metrics Table */}
                    <Card className="h-[500px] flex flex-col">
                        <CardHeader>
                            <CardTitle>Processing Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800">
                                    <tr>
                                        <th className="px-4 py-2">ID</th>
                                        {/* <th className="px-4 py-2">STT</th>
                                        <th className="px-4 py-2">Enhance</th>
                                        <th className="px-4 py-2">TTS</th> */}
                                        <th className="px-4 py-2">Total</th>
                                        <th className="px-4 py-2">Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.map((m, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-slate-100 dark:border-slate-800"
                                        >
                                            <td className="px-4 py-2 font-mono">
                                                {m.id}
                                            </td>
                                            {/* <td className="px-4 py-2">
                                                {m.sttDuration ? `${m.sttDuration}ms` : '-'}
                                            </td>
                                            <td className="px-4 py-2">
                                                {m.enhanceDuration ? `${m.enhanceDuration}ms` : '-'}
                                            </td>
                                            <td className="px-4 py-2">
                                                {m.ttsDuration ? `${m.ttsDuration}ms` : '-'}
                                            </td> */}
                                            <td className="px-4 py-2 font-bold">
                                                {m.duration}ms
                                            </td>
                                            <td className="px-4 py-2">
                                                {m.error ? (
                                                    <span className="text-red-500">
                                                        Error
                                                    </span>
                                                ) : (
                                                    <span className="text-green-500">
                                                        Success
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Raw Transcript</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48 overflow-y-auto whitespace-pre-wrap text-sm border rounded p-2 bg-slate-50 dark:bg-slate-900">
                                {transcript}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Enhanced Script</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48 overflow-y-auto whitespace-pre-wrap text-sm border rounded p-2 bg-slate-50 dark:bg-slate-900">
                                {script}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
