"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDoc, AppConfig } from "@/app/page";
import { GROQ_MODELS } from "./ApiKeySetup";
import SettingsPanel from "./SettingsPanel";

declare global { interface Window { pdfjsLib: any; } }

async function extractPDFText(file: File): Promise<{ text: string; pages: number }> {
  return new Promise((resolve, reject) => {
    const load = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      file.arrayBuffer().then(async (buf) => {
        try {
          const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
          let text = "";
          const max = Math.min(pdf.numPages, 40);
          for (let i = 1; i <= max; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += `\n[Page ${i}]\n${content.items.map((x: any) => x.str).join(" ")}`;
          }
          resolve({ text: text.trim(), pages: pdf.numPages });
        } catch (e) { reject(e); }
      });
    };
    if (document.querySelector('script[src*="pdf.min.js"]') && window.pdfjsLib) { load(); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = load;
    script.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(script);
  });
}

type Props = {
  onDoc: (d: PDFDoc) => void;
  config: AppConfig;
  onChangeKey: () => void;
  onOpenSettings: (cfg: AppConfig) => void;
};

export default function UploadZone({ onDoc, config, onChangeKey, onOpenSettings }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const modelLabel = GROQ_MODELS.find(m => m.id === config.model)?.label ?? config.model;

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    if (file.size > 50 * 1024 * 1024) { setError("File too large. Max 50MB."); return; }
    setLoading(true); setError("");
    try {
      const { text, pages } = await extractPDFText(file);
      onDoc({ name: file.name, text, pages });
    } catch (e: any) {
      setError(e.message || "Failed to read PDF.");
    } finally { setLoading(false); }
  }, [onDoc]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, multiple: false, disabled: loading,
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      {/* Top nav */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: 52, background: "var(--bg2)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50 }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--accent2)" }}>PDF Intelligence</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text2)" }}>{modelLabel}</span>
          </div>
          <button onClick={() => setShowSettings(true)} style={{
            fontSize: 12, padding: "4px 12px", borderRadius: 8,
            border: "1px solid var(--border)", background: "transparent", color: "var(--text2)", cursor: "pointer",
          }}>
            ⚙️ Settings
          </button>
        </div>
      </header>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "0.75rem" }}>
            Drop your <span style={{ color: "var(--accent2)" }}>PDF</span>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text2)", maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
            Up to 50 MB · 40 pages · Cards + chat powered by {modelLabel}
          </p>
        </div>

        {/* Dropzone */}
        <div {...getRootProps()} style={{
          width: "100%", maxWidth: 500,
          border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border2)"}`,
          borderRadius: 20, padding: "3rem 2rem", textAlign: "center",
          cursor: loading ? "not-allowed" : "pointer",
          background: isDragActive ? "rgba(124,106,247,0.08)" : "var(--bg2)",
          transition: "all 0.2s",
        }}>
          <input {...getInputProps()} />
          <div style={{ fontSize: 44, marginBottom: "1rem" }}>📄</div>
          {loading ? (
            <>
              <div style={{ width: 34, height: 34, border: "3px solid var(--border2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
              <p style={{ color: "var(--accent2)", fontWeight: 500 }}>Reading your PDF...</p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 500, fontSize: "1.05rem", marginBottom: "0.5rem" }}>
                {isDragActive ? "Drop it here!" : "Drag & drop your PDF"}
              </p>
              <p style={{ color: "var(--text2)", fontSize: 13 }}>or click to browse</p>
            </>
          )}
        </div>

        {error && (
          <div style={{ marginTop: "1rem", color: "#f87171", fontSize: 14, background: "rgba(248,113,113,0.1)", padding: "10px 16px", borderRadius: 10 }}>
            {error}
          </div>
        )}

        {/* Feature row */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 500, width: "100%", marginTop: "2.5rem" }}>
          {[
            { icon: "🃏", label: "Smart Cards" },
            { icon: "💬", label: "Chat Agent" },
            { icon: "🔒", label: "Key stays in browser" },
            { icon: "🆓", label: "100% Free" },
          ].map(f => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 12px" }}>
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {showSettings && (
        <SettingsPanel
          config={config}
          onSave={(newConfig) => { onOpenSettings(newConfig); setShowSettings(false); }}
          onClear={onChangeKey}
          onClose={() => setShowSettings(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
