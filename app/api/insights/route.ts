import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

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

    if (!apiKey) {
      return NextResponse.json({ error: "No API key provided." }, { status: 401 });
    }
    if (!text) {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }

    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: false });

    const completion = await groq.chat.completions.create({
      model: model || "llama-3.3-70b-versatile",
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
  } catch (e: any) {
    console.error("Insights error:", e);
    const msg = e?.error?.message || e?.message || "Failed to generate insights";
    const status = e?.status || 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
