import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Debug Pipeline",
    description: "Debug the audio processing pipeline.",
};

export default function DebugLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
