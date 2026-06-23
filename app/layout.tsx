import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Intelligence — Powered by Llama 3.3",
  description: "Upload any PDF and get interactive visual insights, smart cards, and a chat agent — all free with open-source AI.",
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
