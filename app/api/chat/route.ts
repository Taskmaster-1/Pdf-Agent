import { NextRequest } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const { messages, docText, apiKey, model, cardContext } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No API key provided." }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: false });

    let systemPrompt = `You are an intelligent document assistant. The user has uploaded a PDF and you help them understand it deeply.

Here is the document content:
---
${docText}
---

Guidelines:
- Answer questions specifically about this document
- Use markdown formatting: **bold**, bullet points, numbered lists, headers when helpful
- If asked for a quiz, generate 5 questions with answers
- If asked to summarize, use bullet points
- Be specific — reference actual content from the document
- If something isn't in the document, say so clearly`;

    if (cardContext) {
      systemPrompt = `You are an expert document assistant. The user is focusing on a specific insight/concept card extracted from the document.
Focus Card:
- Type: ${cardContext.type}
- Title: ${cardContext.title}
- Summary: ${cardContext.body}
${cardContext.emphasis ? `- Highlighted Detail: ${cardContext.emphasis}` : ""}

Here is the full document content for reference:
---
${docText}
---

Guidelines:
- Help the user deep dive into this specific concept/card.
- Answer questions specifically about this card in the context of the document.
- Use markdown formatting: **bold**, bullet points, numbered lists, code snippets, etc.
- If the user asks about chapters, pages, or sections where this appears, scan the document text carefully to identify and point them out.
- Be concise, accurate, and direct. If the information isn't present in the document, say so clearly.`;
    }

    const stream = await groq.chat.completions.create({
      model: model || "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.6,
      max_tokens: 1500,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = JSON.stringify({ choices: [{ delta: { content: chunk.choices[0]?.delta?.content || "" } }] });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (e) { controller.error(e); }
        finally { controller.close(); }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  } catch (e: any) {
    console.error("Chat error:", e);
    return new Response(JSON.stringify({ error: e?.error?.message || e?.message || "Failed" }), {
      status: e?.status || 500, headers: { "Content-Type": "application/json" },
    });
  }
}
