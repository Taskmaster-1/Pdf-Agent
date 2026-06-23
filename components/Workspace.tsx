"use client";
import { useState } from "react";
import { PDFDoc, AppConfig } from "@/app/page";
import InsightsPanel from "./InsightsPanel";
import ChatPanel from "./ChatPanel";
import SettingsPanel from "./SettingsPanel";
import { GROQ_MODELS } from "./ApiKeySetup";

type Tab = "insights" | "chat";
type Props = { doc: PDFDoc; config: AppConfig; onReset: () => void; onChangeKey: () => void; onUpdateConfig: (c: AppConfig) => void; };

export default function Workspace({ doc, config, onReset, onChangeKey, onUpdateConfig }: Props) {
  const [tab, setTab] = useState<Tab>("insights");
  const [showSettings, setShowSettings] = useState(false);
  const modelLabel = GROQ_MODELS.find(m => m.id === config.model)?.label ?? config.model;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
        padding: "0 1.25rem", height: 54, background: "var(--bg2)",
        borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "var(--accent2)" }}>PDF Intelligence</span>
          <span style={{ color: "var(--border2)" }}>|</span>
          <span style={{ fontSize: 12, color: "var(--text2)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {doc.name}
          </span>
          <span style={{ fontSize: 11, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 7px", color: "var(--text2)" }}>
            {doc.pages}p
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {(["insights", "chat"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "4px 12px", borderRadius: 8, border: "1px solid",
              borderColor: tab === t ? "var(--accent)" : "var(--border)",
              background: tab === t ? "rgba(124,106,247,0.15)" : "transparent",
              color: tab === t ? "var(--accent2)" : "var(--text2)",
              fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}>
              {t === "insights" ? "🃏 Insights" : "💬 Chat"}
            </button>
          ))}

          <button onClick={onReset} title="Upload new PDF" style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text2)", cursor: "pointer" }}>
            ← New PDF
          </button>

          <button onClick={() => setShowSettings(true)} title="Settings" style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "4px 10px",
            borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", cursor: "pointer",
          }}>
            ⚙️ <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{modelLabel.split(" ").slice(0,3).join(" ")}</span>
          </button>
        </div>
      </header>

      <main style={{ flex: 1, overflow: "hidden" }}>
        {tab === "insights"
          ? <InsightsPanel doc={doc} config={config} onSwitchToChat={() => setTab("chat")} />
          : <ChatPanel doc={doc} config={config} />}
      </main>

      {showSettings && (
        <SettingsPanel
          config={config}
          onSave={(newConfig) => { onUpdateConfig(newConfig); setShowSettings(false); }}
          onClear={onChangeKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
