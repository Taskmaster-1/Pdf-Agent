"use client";
import { useState } from "react";

export const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile",        label: "Llama 3.3 70B",        desc: "Best quality — recommended",  badge: "⭐ Best" },
  { id: "llama-3.1-8b-instant",           label: "Llama 3.1 8B Instant", desc: "Fastest responses",           badge: "⚡ Fast" },
  { id: "mixtral-8x7b-32768",             label: "Mixtral 8x7B",         desc: "Long context (32k tokens)",   badge: "📄 Long" },
  { id: "gemma2-9b-it",                   label: "Gemma 2 9B",           desc: "Google's open model",         badge: "🔵 Google" },
  { id: "deepseek-r1-distill-llama-70b",  label: "DeepSeek R1 70B",      desc: "Strong reasoning",            badge: "🧠 Reason" },
];

type Props = { onSave: (key: string, model: string) => void };

type Step = "welcome" | "getkey" | "setup";

export default function ApiKeySetup({ onSave }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const [key, setKey] = useState("");
  const [model, setModel] = useState(GROQ_MODELS[0].id);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [testMsg, setTestMsg] = useState("");

  async function testKey() {
    if (!key.trim()) return;
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
    } catch {
      setTestResult("fail"); setTestMsg("Connection error. Check your network.");
    } finally { setTesting(false); }
  }

  function save() {
    if (!key.trim()) return;
    onSave(key.trim(), model);
  }

  const selectedModel = GROQ_MODELS.find(m => m.id === model)!;

  // ── STEP: WELCOME ──────────────────────────────────────────────────────────
  if (step === "welcome") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 100, padding: "5px 14px", marginBottom: "1.75rem" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "var(--text2)" }}>100% free · Open-source AI · No account needed for this app</span>
        </div>

        <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1rem" }}>
          Chat with any <span style={{ color: "var(--accent2)" }}>PDF</span><br />using free AI
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--text2)", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: 440, margin: "0 auto 2.5rem" }}>
          Upload any PDF and get smart insight cards + a streaming chat agent — powered by open-source Llama 3.3 via Groq's free API.
        </p>

        {/* Feature grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: "2.5rem" }}>
          {[
            { icon: "📄", title: "Any PDF", body: "Research papers, books, reports, contracts — up to 50 MB" },
            { icon: "🃏", title: "Smart Cards", body: "AI generates visual insight cards for every key concept" },
            { icon: "💬", title: "Chat Agent", body: "Ask anything about your document, get streamed answers" },
            { icon: "🔒", title: "Private", body: "Your key lives in your browser only, never on our server" },
            { icon: "⚡", title: "Fast", body: "Groq runs Llama at blazing inference speed" },
            { icon: "🆓", title: "Free", body: "Groq free tier: 500 req/day, no credit card needed" },
          ].map(f => (
            <div key={f.title} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 12px", textAlign: "left" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{f.body}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setStep("getkey")} style={{
          padding: "14px 36px", borderRadius: 14, border: "none", background: "var(--accent)",
          color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em",
        }}>
          Get started — it's free →
        </button>
        <p style={{ marginTop: 12, fontSize: 12, color: "var(--text3)" }}>Takes about 2 minutes to set up</p>
      </div>
    </div>
  );

  // ── STEP: GET KEY GUIDE ────────────────────────────────────────────────────
  if (step === "getkey") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        <button onClick={() => setStep("welcome")} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 13, marginBottom: "1.5rem", padding: 0 }}>
          ← Back
        </button>

        <h2 style={{ fontSize: "1.6rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          Step 1 — Get your free <span style={{ color: "var(--accent2)" }}>Groq API key</span>
        </h2>
        <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6, marginBottom: "1.75rem" }}>
          Groq is a free AI inference platform. No credit card, no subscription — just sign up and copy your key.
        </p>

        {/* Steps */}
        {[
          { n: "1", title: "Open Groq console", body: <>Go to <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color: "var(--accent2)" }}>console.groq.com</a> and click <strong style={{ color: "var(--text)" }}>Sign Up</strong> (or Log In if you already have an account). It's completely free.</> },
          { n: "2", title: "Create an API key", body: <>In the left sidebar click <strong style={{ color: "var(--text)" }}>API Keys</strong>, then <strong style={{ color: "var(--text)" }}>Create API Key</strong>. Give it any name you like.</> },
          { n: "3", title: "Copy the key", body: <>Copy the key — it starts with <code style={{ background: "var(--bg3)", padding: "2px 6px", borderRadius: 4, fontSize: 12, fontFamily: "monospace" }}>gsk_</code>. You'll paste it in the next step. Keep it private.</> },
        ].map(s => (
          <div key={s.n} style={{ display: "flex", gap: 14, marginBottom: "1.25rem" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(124,106,247,0.15)", border: "1px solid var(--accent)", color: "var(--accent2)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {s.n}
            </div>
            <div style={{ paddingTop: 4 }}>
              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{s.body}</div>
            </div>
          </div>
        ))}

        {/* Visual hint box */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", marginBottom: "1.75rem", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 22 }}>💡</span>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>Free tier limits</div>
            <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
              Groq free tier gives you <strong style={{ color: "var(--text)" }}>6,000 tokens/min</strong> and <strong style={{ color: "var(--text)" }}>500 requests/day</strong>. That's more than enough for analysing PDFs and chatting with them. No credit card ever needed.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{
            flex: 1, padding: "12px", borderRadius: 12, border: "1px solid var(--accent)",
            background: "rgba(124,106,247,0.12)", color: "var(--accent2)", fontSize: 14, fontWeight: 500,
            cursor: "pointer", textDecoration: "none", textAlign: "center",
          }}>
            Open Groq Console ↗
          </a>
          <button onClick={() => setStep("setup")} style={{
            flex: 1, padding: "12px", borderRadius: 12, border: "none",
            background: "var(--accent)", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            I have my key →
          </button>
        </div>
      </div>
    </div>
  );

  // ── STEP: SETUP ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        <button onClick={() => setStep("getkey")} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 13, marginBottom: "1.5rem", padding: 0 }}>
          ← Back
        </button>

        <h2 style={{ fontSize: "1.6rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          Step 2 — <span style={{ color: "var(--accent2)" }}>Paste your key</span> &amp; pick a model
        </h2>
        <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6, marginBottom: "1.75rem" }}>
          Your key is saved in your browser only and never sent to our servers.
        </p>

        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* API Key */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8, color: "var(--text2)" }}>Groq API Key</label>
            <div style={{ position: "relative" }}>
              <input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={e => { setKey(e.target.value); setTestResult(null); }}
                placeholder="gsk_••••••••••••••••••"
                style={{
                  width: "100%", background: "var(--bg3)",
                  border: `1px solid ${testResult === "ok" ? "#34d399" : testResult === "fail" ? "#f87171" : "var(--border)"}`,
                  borderRadius: 10, padding: "10px 44px 10px 14px", color: "var(--text)", fontSize: 14,
                  outline: "none", fontFamily: "monospace", transition: "border-color 0.2s",
                }}
                onFocus={e => { if (!testResult) e.target.style.borderColor = "var(--accent)"; }}
                onBlur={e => { if (!testResult) e.target.style.borderColor = "var(--border)"; }}
                onKeyDown={e => e.key === "Enter" && save()}
              />
              <button onClick={() => setShowKey(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 16, padding: 0 }}>
                {showKey ? "🙈" : "👁️"}
              </button>
            </div>
            {testResult && (
              <p style={{ marginTop: 6, fontSize: 12, color: testResult === "ok" ? "#34d399" : "#f87171" }}>
                {testResult === "ok" ? "✓" : "✗"} {testMsg}
              </p>
            )}
          </div>

          {/* Model */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8, color: "var(--text2)" }}>Choose model</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {GROQ_MODELS.map(m => (
                <button key={m.id} onClick={() => setModel(m.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10,
                  border: `1px solid ${model === m.id ? "var(--accent)" : "var(--border)"}`,
                  background: model === m.id ? "rgba(124,106,247,0.12)" : "var(--bg3)",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 6, background: "var(--bg2)", color: "var(--text2)", border: "1px solid var(--border)", whiteSpace: "nowrap" }}>{m.badge}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>{m.desc}</div>
                  </div>
                  {model === m.id && <span style={{ color: "var(--accent2)" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={testKey} disabled={!key.trim() || testing} style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--border)",
              background: "transparent", color: "var(--text2)", fontSize: 13, fontWeight: 500,
              cursor: key.trim() && !testing ? "pointer" : "not-allowed",
            }}>
              {testing ? "Testing…" : "Test key"}
            </button>
            <button onClick={save} disabled={!key.trim()} style={{
              flex: 2, padding: "10px", borderRadius: 10, border: "none",
              background: key.trim() ? "var(--accent)" : "var(--bg3)",
              color: key.trim() ? "white" : "var(--text3)", fontSize: 14, fontWeight: 600,
              cursor: key.trim() ? "pointer" : "not-allowed",
            }}>
              Start with {selectedModel.label.split(" ").slice(0, 2).join(" ")} →
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>🔒</span>
            <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>
              Stored in <strong style={{ color: "var(--text)" }}>your browser's localStorage only</strong>. Never sent to our server. Clear it any time from Settings.
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: "1.5rem" }}>
          {["welcome","getkey","setup"].map((s, i) => (
            <div key={s} style={{ width: s === step ? 20 : 6, height: 6, borderRadius: 3, background: s === step ? "var(--accent)" : "var(--border2)", transition: "all 0.2s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
