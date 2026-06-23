"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { PDFDoc, AppConfig } from "@/app/page";
import { Card, Message } from "@/lib/types";
import { TYPE_STYLES } from "@/lib/cardStyles";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  card: Card;
  doc: PDFDoc;
  config: AppConfig;
  onClose: () => void;
};

export default function CardChatDrawer({ card, doc, config, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const styleInfo = TYPE_STYLES[card.type] ?? TYPE_STYLES.concept;

  // Slide-in animation trigger
  useEffect(() => {
    const t = setTimeout(() => setIsOpen(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Initialize with greeting
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Hello! Let's explore the card **"${card.title}"** deeply.\n\nYou can ask me:\n- *Which chapters, pages, or sections discuss this?*\n- *Can you explain this concept in more detail?*\n- *What are the key takeaways or implications?*`,
        id: crypto.randomUUID(),
      },
    ]);
  }, [card]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cancel any in-flight stream on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const handleClose = () => {
    abortRef.current?.abort();
    setIsOpen(false);
    setTimeout(onClose, 250);
  };

  const send = useCallback(async (text?: string) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userMsg: Message = { role: "user", content: q, id: crypto.randomUUID() };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = { role: "assistant", content: "", id: assistantId };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

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
          cardContext: {
            type: card.type,
            title: card.title,
            body: card.body,
            emphasis: card.emphasis,
          },
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
      if ((e as { name?: string }).name === "AbortError") return;
      const err = e as { message?: string };
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: `Error: ${err.message}` } : m
      ));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, config, doc.text, card]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const SUGGESTED_QUESTIONS = [
    "Which chapters or pages discuss this?",
    "Explain this in more detail",
    "What are the key implications?",
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(3px)", opacity: isOpen ? 1 : 0,
          transition: "opacity 0.25s ease-in-out", zIndex: 999,
        }}
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Deep dive: ${card.title}`}
        style={{
          position: "fixed", top: 0, bottom: 0, right: 0,
          width: "min(500px, 100vw)", background: "rgba(24, 24, 31, 0.95)",
          backdropFilter: "blur(12px)", borderLeft: "1px solid var(--border)",
          boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.5)", zIndex: 1000,
          display: "flex", flexDirection: "column",
          transform: isOpen ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)",
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <header style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{styleInfo.icon}</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={card.title}>
                  {card.title}
                </h3>
                <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 6, background: styleInfo.badge, color: styleInfo.badgeText, textTransform: "uppercase" }}>
                  {card.type}
                </span>
              </div>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>Card Deep Dive</span>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close drawer"
            style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border2)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            ×
          </button>
        </header>

        {/* Card Context Mini-Panel */}
        <div style={{ padding: "1rem 1.25rem", background: "rgba(124, 106, 247, 0.05)", borderBottom: "1px solid var(--border)" }}>
          {card.emphasis && (
            <div style={{ background: "var(--bg3)", borderRadius: 6, padding: "4px 8px", marginBottom: 6, fontSize: 12, color: styleInfo.badgeText, fontWeight: 500, display: "inline-block" }}>
              {card.emphasis}
            </div>
          )}
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--text2)", lineHeight: 1.5, maxHeight: 70, overflowY: "auto" }}>
            {card.body}
          </p>
        </div>

        {/* Chat Feed */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
          {messages.map(m => (
            <div key={m.id} style={{ display: "flex", gap: 10, marginBottom: "1rem", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: m.role === "user" ? "var(--accent)" : "var(--bg3)", border: `1px solid ${m.role === "user" ? "var(--accent)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                {m.role === "user" ? "👤" : styleInfo.icon}
              </div>
              <div style={{ maxWidth: "82%", background: m.role === "user" ? "rgba(124, 106, 247, 0.15)" : "var(--bg2)", border: `1px solid ${m.role === "user" ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, padding: "8px 12px", borderBottomRightRadius: m.role === "user" ? 2 : 12, borderBottomLeftRadius: m.role === "assistant" ? 2 : 12 }}>
                {m.content ? (
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text)" }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      p: ({ children }) => <p style={{ marginBottom: "0.5em" }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ paddingLeft: "1.1rem", marginBottom: "0.5em" }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ paddingLeft: "1.1rem", marginBottom: "0.5em" }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: "0.2em" }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ color: "var(--accent2)", fontWeight: 600 }}>{children}</strong>,
                      code: ({ children }) => <code style={{ background: "var(--bg3)", padding: "1px 4px", borderRadius: 4, fontSize: 11, fontFamily: "monospace" }}>{children}</code>,
                    }}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 3, alignItems: "center", height: 16 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.25rem", background: "var(--bg2)" }}>
          {messages.length === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500 }}>SUGGESTED QUESTIONS:</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SUGGESTED_QUESTIONS.map(q => (
                  <button key={q} onClick={() => send(q)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontSize: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about this card… (Enter to send)"
              rows={1}
              aria-label="Card chat input"
              style={{ flex: 1, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", color: "var(--text)", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.4, minHeight: 36, maxHeight: 80 }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 80) + "px";
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: input.trim() && !loading ? "var(--accent)" : "var(--bg3)", color: "white", fontSize: 16, cursor: input.trim() && !loading ? "pointer" : "not-allowed", transition: "all 0.15s", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {loading ? "⏳" : "↑"}
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
