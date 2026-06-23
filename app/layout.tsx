import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c6af7",
};

export const metadata: Metadata = {
  title: "PDF Intelligence — Chat with any PDF using free AI",
  description:
    "Upload any PDF and get interactive visual insight cards plus a streaming chat agent — powered by open-source Llama 3.3 via Groq's free API. No account required.",
  keywords: ["PDF", "AI", "chat", "Llama", "Groq", "document analysis", "PDF reader"],
  openGraph: {
    title: "PDF Intelligence — Chat with any PDF using free AI",
    description:
      "Upload any PDF and get smart insight cards + a streaming chat agent. 100% free, open-source AI. No account needed.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Intelligence — Chat with any PDF using free AI",
    description:
      "Upload any PDF and get smart insight cards + a streaming chat agent. Powered by Llama 3.3 via Groq — 100% free.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}

