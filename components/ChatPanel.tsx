"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { PDFDoc, AppConfig } from "@/app/page";
import { Message } from "@/lib/types";
import { GROQ_MODELS } from "./ApiKeySetup";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SUGGESTED = [
  "Summarize this document in 3 bullet points",
  "What are the most important concepts?",
  "What are the key risks or warnings mentioned?",
  "Generate a quiz from this content",
  "What should I do with this information?",
];

export default function ChatPanel({ doc, config }: { doc: PDFDoc; config: AppConfig }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const modelLabel = GROQ_MODELS.find(m => m.id === config.model)?.label ?? config.model;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cancel any in-flight stream when the component unmounts
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const send = useCallback(async (text?: string) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: q, id: crypto.randomUUID() };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = { role: "assistant", content: "", id: assistantId };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    // Cancel previous in-flight request if any
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: config.apiKey,
          model: config.model,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          docText: doc.text.slice(0, 12000),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              accumulated += delta;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m));
            } catch { /* partial JSON chunk — ignore */ }
          }
        }
      }
    } catch (e: unknown) {
      if ((e as { name?: string }).name === "AbortError") return; // user navigated away
      const err = e as { message?: string };
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: `Error: ${err.message}` } : m
      ));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, config, doc.text]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {messages.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: "3rem" }}>
              <div style={{ fontSize: 48, marginBottom: "1rem" }}>🤖</div>
              <h2 style={{ fontWeight: 500, marginBottom: 8 }}>Chat with your document</h2>
              <p style={{ color: "var(--text2)", marginBottom: "2rem", fontSize: 14 }}>
                Ask anything about <strong style={{ color: "var(--text)" }}>{doc.name}</strong>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400, margin: "0 auto" }}>
                {SUGGESTED.map(s => (
                  <button key={s} onClick={() => send(s)} style={{
                    padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)",
                    background: "var(--bg2)", color: "var(--text2)", fontSize: 13, cursor: "pointer",
                    textAlign: "left", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} style={{
              display: "flex", gap: 12, marginBottom: "1.25rem",
              flexDirection: m.role === "user" ? "row-reverse" : "row",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: m.role === "user" ? "var(--accent)" : "var(--bg3)",
                border: `1px solid ${m.role === "user" ? "var(--accent)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              }}>
                {m.role === "user" ? "👤" : "🤖"}
              </div>
              <div style={{
                maxWidth: "80%", background: m.role === "user" ? "rgba(124,106,247,0.15)" : "var(--bg2)",
                border: `1px solid ${m.role === "user" ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 14, padding: "10px 14px",
                borderBottomRightRadius: m.role === "user" ? 4 : 14,
                borderBottomLeftRadius: m.role === "assistant" ? 4 : 14,
              }}>
                {m.content ? (
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)" }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p style={{ marginBottom: "0.75em" }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ paddingLeft: "1.25rem", marginBottom: "0.75em" }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ paddingLeft: "1.25rem", marginBottom: "0.75em" }}>{children}</ol>,
                        li: ({ children }) => <li style={{ marginBottom: "0.25em" }}>{children}</li>,
                        strong: ({ children }) => <strong style={{ color: "var(--accent2)", fontWeight: 600 }}>{children}</strong>,
                        code: ({ children }) => <code style={{ background: "var(--bg3)", padding: "2px 5px", borderRadius: 4, fontSize: 12, fontFamily: "monospace" }}>{children}</code>,
                        blockquote: ({ children }) => <blockquote style={{ borderLeft: "3px solid var(--accent)", paddingLeft: "1rem", color: "var(--text2)", margin: "0.75em 0" }}>{children}</blockquote>,
                      }}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 4, alignItems: "center", height: 20 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.5rem", background: "var(--bg2)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about this document… (Enter to send, Shift+Enter for new line)"
            rows={1}
            aria-label="Chat input"
            style={{
              flex: 1, background: "var(--bg3)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "10px 14px", color: "var(--text)", fontSize: 14,
              resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5,
              minHeight: 44, maxHeight: 120,
            }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            style={{
              width: 44, height: 44, borderRadius: 12, border: "none",
              background: input.trim() && !loading ? "var(--accent)" : "var(--bg3)",
              color: "white", fontSize: 18, cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              transition: "all 0.15s", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {loading ? "⏳" : "↑"}
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text3)", marginTop: 8 }}>
          Powered by {modelLabel} via Groq
        </p>
      </div>
    </div>
  );
}
