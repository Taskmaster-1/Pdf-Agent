"use client";
import { useState, useEffect } from "react";
import { PDFDoc } from "@/app/page";

type Card = {
  id: string;
  type: "concept" | "insight" | "warning" | "quote" | "stat" | "summary";
  title: string;
  body: string;
  tags?: string[];
  emphasis?: string;
};

type InsightData = {
  summary: string;
  cards: Card[];
  topics: string[];
};

const TYPE_STYLES: Record<Card["type"], { icon: string; border: string; badge: string; badgeText: string }> = {
  concept:  { icon: "💡", border: "var(--accent)",  badge: "rgba(124,106,247,0.15)", badgeText: "var(--accent2)" },
  insight:  { icon: "🔍", border: "var(--green)",   badge: "rgba(52,211,153,0.12)",  badgeText: "var(--green)"   },
  warning:  { icon: "⚠️", border: "var(--amber)",   badge: "rgba(251,191,36,0.12)",  badgeText: "var(--amber)"   },
  quote:    { icon: "💬", border: "var(--text3)",   badge: "rgba(255,255,255,0.05)", badgeText: "var(--text2)"   },
  stat:     { icon: "📊", border: "#60a5fa",        badge: "rgba(96,165,250,0.12)",  badgeText: "#93c5fd"        },
  summary:  { icon: "📋", border: "#f472b6",        badge: "rgba(244,114,182,0.12)", badgeText: "#f9a8d4"        },
};

import { AppConfig } from "@/app/page";
import CardChatDrawer from "./CardChatDrawer";

export default function InsightsPanel({ doc, config, onSwitchToChat }: { doc: PDFDoc; config: AppConfig; onSwitchToChat: () => void }) {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectedCardForChat, setSelectedCardForChat] = useState<Card | null>(null);

  useEffect(() => {
    generate();
  }, [doc.text]);

  async function generate() {
    setLoading(true);
    setError("");
    setProgress("Sending to Llama 3.3 70B...");
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: doc.text.slice(0, 12000), apiKey: config.apiKey, model: config.model }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: "3px solid var(--border2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "var(--text2)", fontSize: 14 }}>{progress}</p>
      <p style={{ color: "var(--text3)", fontSize: 12 }}>Llama 3.3 is reading your PDF and generating cards...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh", gap: 12 }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ color: "var(--red)" }}>{error}</p>
      <button onClick={generate} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid var(--accent)", background: "transparent", color: "var(--accent2)", cursor: "pointer" }}>
        Try again
      </button>
      {error.includes("API key") && (
        <p style={{ color: "var(--text2)", fontSize: 13, maxWidth: 400, textAlign: "center" }}>
          Add your Groq API key to <code style={{ background: "var(--bg3)", padding: "2px 6px", borderRadius: 4 }}>.env.local</code> as <code style={{ background: "var(--bg3)", padding: "2px 6px", borderRadius: 4 }}>GROQ_API_KEY</code>
        </p>
      )}
    </div>
  );

  if (!data) return null;

  const topics = Array.isArray(data.topics) ? data.topics : [];
  const cards = Array.isArray(data.cards) ? data.cards : [];
  const allTopics = ["all", ...topics];
  const filtered = filter === "all" ? cards : cards.filter(c => Array.isArray(c.tags) && c.tags.includes(filter));

  return (
    <div style={{ height: "calc(100vh - 56px)", overflowY: "auto", padding: "1.5rem" }}>
      {/* Summary banner */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.5rem", maxWidth: 900, margin: "0 auto 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>📄</span>
          <span style={{ fontWeight: 500, fontSize: 14 }}>Document Summary</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text3)" }}>{cards.length} cards generated</span>
        </div>
        <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7 }}>{data.summary}</p>
        <button onClick={onSwitchToChat} style={{
          marginTop: 12, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--accent)",
          background: "rgba(124,106,247,0.12)", color: "var(--accent2)", fontSize: 13, cursor: "pointer",
        }}>
          Ask questions about this document →
        </button>
      </div>

      {/* Topic filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 900, margin: "0 auto 1.25rem", overflowX: "auto" }}>
        {allTopics.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: "4px 12px", borderRadius: 20, border: "1px solid",
            borderColor: filter === t ? "var(--accent)" : "var(--border)",
            background: filter === t ? "rgba(124,106,247,0.15)" : "transparent",
            color: filter === t ? "var(--accent2)" : "var(--text2)",
            fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
          }}>
            {t}
          </button>
        ))}
        <button onClick={generate} style={{
          padding: "4px 12px", borderRadius: 20, border: "1px solid var(--border)",
          background: "transparent", color: "var(--text2)", fontSize: 12, cursor: "pointer", marginLeft: "auto",
        }}>
          ↻ Regenerate
        </button>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, maxWidth: 900, margin: "0 auto" }}>
        {filtered.map(card => {
          const style = TYPE_STYLES[card.type] || TYPE_STYLES.concept;
          const isExpanded = expanded === card.id;
          return (
            <div key={card.id} onClick={() => setExpanded(isExpanded ? null : card.id)}
              style={{
                background: "var(--bg2)",
                borderWidth: "1px 1px 1px 3px",
                borderStyle: "solid",
                borderColor: `${isExpanded ? style.border : "var(--border)"} ${isExpanded ? style.border : "var(--border)"} ${isExpanded ? style.border : "var(--border)"} ${style.border}`,
                borderRadius: 14, padding: "1rem", cursor: "pointer", transition: "all 0.15s",
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{style.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{card.title}</span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: style.badge, color: style.badgeText }}>
                      {card.type}
                    </span>
                  </div>
                </div>
              </div>

              {card.emphasis && (
                <div style={{ background: "var(--bg3)", borderRadius: 8, padding: "6px 10px", marginBottom: 8, fontSize: 13, color: style.badgeText, fontWeight: 500 }}>
                  {card.emphasis}
                </div>
              )}

              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, display: isExpanded ? "block" : "-webkit-box", WebkitLineClamp: isExpanded ? undefined : 3, WebkitBoxOrient: "vertical", overflow: isExpanded ? "visible" : "hidden" }}>
                {card.body}
              </p>

              {card.tags && card.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                  {card.tags.map(t => (
                    <span key={t} onClick={e => { e.stopPropagation(); setFilter(t); }} style={{
                      fontSize: 11, padding: "2px 7px", borderRadius: 8, background: "var(--bg3)",
                      color: "var(--text3)", border: "1px solid var(--border)", cursor: "pointer",
                    }}>#{t}</span>
                  ))}
                </div>
              )}

              {isExpanded && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedCardForChat(card);
                  }}
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid var(--accent)",
                    background: "rgba(124, 106, 247, 0.1)",
                    color: "var(--accent2)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  💬 Deep Dive & Ask Questions
                </button>
              )}

              <div style={{ marginTop: 10, fontSize: 11, color: "var(--text3)", textAlign: "right" }}>
                {isExpanded ? "Click to collapse ↑" : "Click to expand ↓"}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text2)", padding: "3rem", maxWidth: 900, margin: "0 auto" }}>
          No cards match "{filter}" — <button onClick={() => setFilter("all")} style={{ color: "var(--accent2)", background: "none", border: "none", cursor: "pointer" }}>show all</button>
        </div>
      )}

      {selectedCardForChat && (
        <CardChatDrawer
          card={selectedCardForChat}
          doc={doc}
          config={config}
          onClose={() => setSelectedCardForChat(null)}
        />
      )}
    </div>
  );
}
