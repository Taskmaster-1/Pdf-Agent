import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const ALLOWED_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
  "deepseek-r1-distill-llama-70b",
]);

const MAX_TEXT_CHARS = 20_000; // server-side guard

const SYSTEM = `You are an expert document analyst. Analyze the provided PDF text and return a JSON object with this exact structure:

{
  "summary": "2-3 sentence overview of the document",
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "cards": [
    {
      "id": "1",
      "type": "concept|insight|warning|quote|stat|summary",
      "title": "Short title (max 6 words)",
      "body": "2-4 sentence explanation",
      "emphasis": "Optional: one key phrase or number to highlight (null if not applicable)",
      "tags": ["topic1", "topic2"]
    }
  ]
}

Rules:
- Generate 8-14 cards covering the most important content
- Use diverse card types: concept (key ideas), insight (non-obvious findings), warning (risks/caveats), stat (numbers/metrics), quote (notable statements), summary (section summaries)
- Tags must come from the topics array
- emphasis should be a key metric, phrase, or number worth highlighting — keep it short (under 10 words)
- Return ONLY valid JSON, no markdown, no explanation`;

export async function POST(req: NextRequest) {
  try {
    const { text, apiKey, model } = await req.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "No API key provided." }, { status: 401 });
    }
    if (!model || !ALLOWED_MODELS.has(model)) {
      return NextResponse.json({ error: "Invalid or unsupported model." }, { status: 400 });
    }
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }
    if (text.length > MAX_TEXT_CHARS) {
      return NextResponse.json({ error: "Document text too large." }, { status: 400 });
    }

    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: false });

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Analyze this document:\n\n${text}` },
      ],
      temperature: 0.4,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const err = e as { error?: { message?: string }; message?: string; status?: number };
    console.error("Insights error:", err);
    const msg = err?.error?.message || err?.message || "Failed to generate insights";
    const status = err?.status || 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
