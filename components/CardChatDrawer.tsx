"use client";
import { useState, useRef, useEffect } from "react";
import { PDFDoc, AppConfig } from "@/app/page";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Card = {
  id: string;
  type: "concept" | "insight" | "warning" | "quote" | "stat" | "summary";
  title: string;
  body: string;
  tags?: string[];
  emphasis?: string;
};

type Props = {
  card: Card;
  doc: PDFDoc;
  config: AppConfig;
  onClose: () => void;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  id: string;
};

const TYPE_STYLES: Record<Card["type"], { icon: string; border: string; badge: string; badgeText: string }> = {
  concept:  { icon: "💡", border: "var(--accent)",  badge: "rgba(124,106,247,0.15)", badgeText: "var(--accent2)" },
  insight:  { icon: "🔍", border: "var(--green)",   badge: "rgba(52,211,153,0.12)",  badgeText: "var(--green)"   },
  warning:  { icon: "⚠️", border: "var(--amber)",   badge: "rgba(251,191,36,0.12)",  badgeText: "var(--amber)"   },
  quote:    { icon: "💬", border: "var(--text3)",   badge: "rgba(255,255,255,0.05)", badgeText: "var(--text2)"   },
  stat:     { icon: "📊", border: "#60a5fa",        badge: "rgba(96,165,250,0.12)",  badgeText: "#93c5fd"        },
  summary:  { icon: "📋", border: "#f472b6",        badge: "rgba(244,114,182,0.12)", badgeText: "#f9a8d4"        },
};

export default function CardChatDrawer({ card, doc, config, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const styleInfo = TYPE_STYLES[card.type] || TYPE_STYLES.concept;

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
        content: `Hello! Let's explore the card **"${card.title}"** deeply. 
        
You can ask me questions such as:
- *Which chapters, pages, or sections discuss this?*
- *Can you explain this concept in more detail?*
- *What are the key takeaways or implications of this card?*`,
        id: "greet",
      },
    ]);
  }, [card]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 250); // wait for exit animation
  };

  async function send(text?: string) {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userMsg: Message = { role: "user", content: q, id: Date.now().toString() };
    const assistantMsg: Message = { role: "assistant", content: "", id: (Date.now() + 1).toString() };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
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
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              accumulated += delta;
              setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: accumulated } : m));
            } catch {}
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, content: `Error: ${e.message}` } : m
      ));
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const SUGGESTED_QUESTIONS = [
    "Which chapters or pages discuss this?",
    "Explain this in more detail",
    "What are the key implications?",
  ];

  return (
    <>
      {/* Backdrop with transition */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(3px)",
          opacity: isOpen ? 1 : 0,
          transition: "opacity 0.25s ease-in-out",
          zIndex: 999,
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          right: 0,
          width: "min(500px, 100vw)",
          background: "rgba(24, 24, 31, 0.95)",
          backdropFilter: "blur(12px)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)",
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "1.25rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{styleInfo.icon}</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text)",
                    margin: 0,
                    maxWidth: 240,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={card.title}
                >
                  {card.title}
                </h3>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: 6,
                    background: styleInfo.badge,
                    color: styleInfo.badgeText,
                    textTransform: "uppercase",
                  }}
                >
                  {card.type}
                </span>
              </div>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>Card Deep Dive</span>
            </div>
          </div>

          <button
            onClick={handleClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--border)",
              background: "var(--bg3)",
              color: "var(--text2)",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border2)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            ×
          </button>
        </header>

        {/* Card Context Mini-Panel */}
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "rgba(124, 106, 247, 0.05)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {card.emphasis && (
            <div
              style={{
                background: "var(--bg3)",
                borderRadius: 6,
                padding: "4px 8px",
                marginBottom: 6,
                fontSize: 12,
                color: styleInfo.badgeText,
                fontWeight: 500,
                display: "inline-block",
              }}
            >
              {card.emphasis}
            </div>
          )}
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: "var(--text2)",
              lineHeight: 1.5,
              maxHeight: 70,
              overflowY: "auto",
            }}
          >
            {card.body}
          </p>
        </div>

        {/* Chat Feed */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
          {messages.map(m => (
            <div
              key={m.id}
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "1rem",
                flexDirection: m.role === "user" ? "row-reverse" : "row",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: m.role === "user" ? "var(--accent)" : "var(--bg3)",
                  border: `1px solid ${m.role === "user" ? "var(--accent)" : "var(--border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                }}
              >
                {m.role === "user" ? "👤" : styleInfo.icon}
              </div>
              <div
                style={{
                  maxWidth: "82%",
                  background: m.role === "user" ? "rgba(124, 106, 247, 0.15)" : "var(--bg2)",
                  border: `1px solid ${m.role === "user" ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 12,
                  padding: "8px 12px",
                  borderBottomRightRadius: m.role === "user" ? 2 : 12,
                  borderBottomLeftRadius: m.role === "assistant" ? 2 : 12,
                }}
              >
                {m.content ? (
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text)" }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p style={{ marginBottom: "0.5em" }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ paddingLeft: "1.1rem", marginBottom: "0.5em" }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ paddingLeft: "1.1rem", marginBottom: "0.5em" }}>{children}</ol>,
                        li: ({ children }) => <li style={{ marginBottom: "0.2em" }}>{children}</li>,
                        strong: ({ children }) => <strong style={{ color: "var(--accent2)", fontWeight: 600 }}>{children}</strong>,
                        code: ({ children }) => (
                          <code style={{ background: "var(--bg3)", padding: "1px 4px", borderRadius: 4, fontSize: 11, fontFamily: "monospace" }}>
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 3, alignItems: "center", height: 16 }}>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "var(--accent)",
                          animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Footer with suggested questions & input */}
        <footer style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.25rem", background: "var(--bg2)" }}>
          {messages.length === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500 }}>SUGGESTED QUESTIONS:</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--bg3)",
                      color: "var(--text2)",
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
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
              placeholder="Ask anything about this card..."
              rows={1}
              style={{
                flex: 1,
                background: "var(--bg3)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "8px 12px",
                color: "var(--text)",
                fontSize: 13,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.4,
                minHeight: 36,
                maxHeight: 80,
              }}
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
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "none",
                background: input.trim() && !loading ? "var(--accent)" : "var(--bg3)",
                color: "white",
                fontSize: 16,
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                transition: "all 0.15s",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? "⏳" : "↑"}
            </button>
          </div>
        </footer>

        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-4px); }
          }
        `}</style>
      </div>
    </>
  );
}
