"use client";
import { useState, useCallback, useEffect } from "react";
import ApiKeySetup from "@/components/ApiKeySetup";
import UploadZone from "@/components/UploadZone";
import Workspace from "@/components/Workspace";

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
    } catch {}
    setLoaded(true);
  }, []);

  function saveConfig(cfg: AppConfig) {
    setConfig(cfg);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch {}
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
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  const handleDoc = useCallback((d: PDFDoc) => setDoc(d), []);

  if (!loaded) return null;

  if (!config) return <ApiKeySetup onSave={handleSaveConfig} />;

  if (!doc) return (
    <UploadZone
      onDoc={handleDoc}
      config={config}
      onChangeKey={handleClearConfig}
      onOpenSettings={(newConfig) => saveConfig(newConfig)}
    />
  );

  return (
    <Workspace
      doc={doc}
      config={config}
      onReset={() => setDoc(null)}
      onChangeKey={handleClearConfig}
      onUpdateConfig={handleUpdateConfig}
    />
  );
}
