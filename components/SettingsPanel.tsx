"use client";
import { useState } from "react";
import { AppConfig } from "@/app/page";
import { GROQ_MODELS } from "./ApiKeySetup";

type Props = {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  onClear: () => void;
  onClose: () => void;
};

export default function SettingsPanel({ config, onSave, onClear, onClose }: Props) {
  const [key, setKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [testMsg, setTestMsg] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const changed = key !== config.apiKey || model !== config.model;

  async function testKey() {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key.trim() }),
      });
      const data = await res.json();
      if (data.valid) { setTestResult("ok"); setTestMsg(data.message); }
      else { setTestResult("fail"); setTestMsg(data.message); }
    } catch { setTestResult("fail"); setTestMsg("Network error."); }
    finally { setTesting(false); }
  }

  function save() {
    onSave({ apiKey: key.trim(), model });
    onClose();
  }

  const currentModelLabel = GROQ_MODELS.find(m => m.id === config.model)?.label ?? config.model;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, backdropFilter: "blur(2px)" }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(480px, calc(100vw - 2rem))", zIndex: 101,
        background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 20,
        padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem",
        maxHeight: "90vh", overflowY: "auto",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>⚙️ Settings</h2>
            <p style={{ fontSize: 12, color: "var(--text2)", margin: "3px 0 0" }}>Change your model or API key</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--bg3)", cursor: "pointer", fontSize: 16, color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: 0 }} />

        {/* Current status */}
        <div style={{ background: "var(--bg3)", borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text2)" }}>Active model</span>
            <span style={{ fontWeight: 500 }}>{currentModelLabel}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text2)" }}>API key</span>
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>{config.apiKey.slice(0, 10)}••••</span>
          </div>
        </div>

        {/* API Key */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 7, color: "var(--text2)" }}>API Key</label>
          <div style={{ position: "relative" }}>
            <input
              type={showKey ? "text" : "password"}
              value={key}
              onChange={e => { setKey(e.target.value); setTestResult(null); }}
              style={{
                width: "100%", background: "var(--bg3)",
                border: `1px solid ${testResult === "ok" ? "#34d399" : testResult === "fail" ? "#f87171" : "var(--border)"}`,
                borderRadius: 10, padding: "9px 44px 9px 12px", color: "var(--text)", fontSize: 13,
                outline: "none", fontFamily: "monospace", transition: "border-color 0.2s",
              }}
              onFocus={e => { if (!testResult) e.target.style.borderColor = "var(--accent)"; }}
              onBlur={e => { if (!testResult) e.target.style.borderColor = "var(--border)"; }}
            />
            <button onClick={() => setShowKey(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 14, padding: 0 }}>
              {showKey ? "🙈" : "👁️"}
            </button>
          </div>
          {testResult && (
            <p style={{ marginTop: 5, fontSize: 12, color: testResult === "ok" ? "#34d399" : "#f87171" }}>
              {testResult === "ok" ? "✓" : "✗"} {testMsg}
            </p>
          )}
          <button onClick={testKey} disabled={!key.trim() || testing} style={{ marginTop: 8, fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text2)", cursor: "pointer" }}>
            {testing ? "Testing…" : "Test key"}
          </button>
        </div>

        {/* Model picker */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 7, color: "var(--text2)" }}>Model</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {GROQ_MODELS.map(m => (
              <button key={m.id} onClick={() => setModel(m.id)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10,
                border: `1px solid ${model === m.id ? "var(--accent)" : "var(--border)"}`,
                background: model === m.id ? "rgba(124,106,247,0.12)" : "var(--bg3)",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, background: "var(--bg2)", color: "var(--text2)", border: "1px solid var(--border)", whiteSpace: "nowrap" }}>{m.badge}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>{m.desc}</div>
                </div>
                {model === m.id && <span style={{ color: "var(--accent2)", fontSize: 14 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button onClick={save} disabled={!key.trim() || !changed} style={{
          padding: "11px", borderRadius: 12, border: "none",
          background: (key.trim() && changed) ? "var(--accent)" : "var(--bg3)",
          color: (key.trim() && changed) ? "white" : "var(--text3)",
          fontSize: 14, fontWeight: 600, cursor: (key.trim() && changed) ? "pointer" : "not-allowed",
          transition: "all 0.15s",
        }}>
          {changed ? "Save changes" : "No changes"}
        </button>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: 0 }} />

        {/* Danger zone */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Danger zone</div>
          {!confirmClear ? (
            <button onClick={() => setConfirmClear(true)} style={{
              width: "100%", padding: "9px", borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)",
              background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 13, cursor: "pointer",
            }}>
              Clear API key & reset app
            </button>
          ) : (
            <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, padding: "12px" }}>
              <p style={{ fontSize: 13, color: "#f87171", marginBottom: 10 }}>This will clear your key and return to the start screen. Are you sure?</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button onClick={onClear} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#f87171", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Yes, clear</button>
              </div>
            </div>
          )}
        </div>

        {/* Groq link */}
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text3)", margin: 0 }}>
          Need a key? <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color: "var(--accent2)" }}>console.groq.com</a> — free, no card needed
        </p>
      </div>
    </>
  );
}
