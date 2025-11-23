import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "MadLectures - MadHacks 2025",
        template: "%s | MadLectures - MadHacks 2025",
    },
    description:
        "Real-time AI Audio Assistant for presentations and transcription.",
    keywords: [
        "MadHacks",
        "AI",
        "Audio",
        "Transcription",
        "Slideshow",
        "Real-time",
        "Next.js",
    ],
    authors: [
        { name: "Nik Schaefer" },
        { name: "Benjamin Wasson" },
        { name: "Henry Page" },
        { name: "Eric Du" },
    ],
    openGraph: {
        title: "MadLectures - MadHacks 2025",
        description:
            "Real-time AI Audio Assistant for presentations and transcription.",
        type: "website",
        locale: "en_US",
        siteName: "MadHacks 2025",
    },
    twitter: {
        card: "summary_large_image",
        title: "MadHacks 2025",
        description:
            "Real-time AI Audio Assistant for presentations and transcription.",
    },
    icons: {
        icon: "/logo.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} antialiased`}>{children}</body>
        </html>
    );
}
