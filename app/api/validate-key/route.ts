import { NextRequest, NextResponse } from "next/server";

/** Server-side key validation — keeps the direct Groq call off the browser */
export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ valid: false, message: "No key provided." }, { status: 400 });
    }

    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });

    if (res.ok) {
      return NextResponse.json({ valid: true, message: "Valid key — you're all set!" });
    } else {
      return NextResponse.json({ valid: false, message: "Invalid key. Double-check and try again." });
    }
  } catch {
    return NextResponse.json({ valid: false, message: "Connection error. Check your network." }, { status: 502 });
  }
}
