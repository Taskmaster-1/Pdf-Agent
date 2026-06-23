"use client";
import { useState, useCallback, useEffect } from "react";
import ApiKeySetup from "@/components/ApiKeySetup";
import UploadZone from "@/components/UploadZone";
import Workspace from "@/components/Workspace";
import ErrorBoundary from "@/components/ErrorBoundary";

export type PDFDoc = { name: string; text: string; pages: number; };
export type AppConfig = { apiKey: string; model: string; };

const STORAGE_KEY = "pdf-intelligence-config";

export default function Home() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [doc, setDoc] = useState<PDFDoc | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey && parsed.model) setConfig(parsed);
      }
    } catch (e) {
      // localStorage unavailable (private browsing / storage quota)
      console.warn("[Storage] Could not read saved config:", e);
    }
    setLoaded(true);
  }, []);

  function saveConfig(cfg: AppConfig) {
    setConfig(cfg);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); }
    catch (e) { console.warn("[Storage] Could not save config:", e); }
  }

  function handleSaveConfig(apiKey: string, model: string) {
    saveConfig({ apiKey, model });
  }

  function handleUpdateConfig(cfg: AppConfig) {
    saveConfig(cfg);
  }

  function handleClearConfig() {
    setConfig(null);
    setDoc(null);
    try { localStorage.removeItem(STORAGE_KEY); }
    catch (e) { console.warn("[Storage] Could not clear config:", e); }
  }

  const handleDoc = useCallback((d: PDFDoc) => setDoc(d), []);

  if (!loaded) return null;

  return (
    <ErrorBoundary>
      {!config && <ApiKeySetup onSave={handleSaveConfig} />}
      {config && !doc && (
        <UploadZone
          onDoc={handleDoc}
          config={config}
          onChangeKey={handleClearConfig}
          onOpenSettings={(newConfig) => saveConfig(newConfig)}
        />
      )}
      {config && doc && (
        <Workspace
          doc={doc}
          config={config}
          onReset={() => setDoc(null)}
          onChangeKey={handleClearConfig}
          onUpdateConfig={handleUpdateConfig}
        />
      )}
    </ErrorBoundary>
  );
}
