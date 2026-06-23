"use client";
import React from "react";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean; message: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16, padding: "2rem",
          background: "var(--bg)",
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontWeight: 600, fontSize: 18 }}>Something went wrong</h2>
          <p style={{ color: "var(--text2)", fontSize: 14, maxWidth: 400, textAlign: "center" }}>
            {this.state.message || "An unexpected error occurred. Please refresh the page."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 24px", borderRadius: 10, border: "1px solid var(--accent)",
              background: "rgba(124,106,247,0.12)", color: "var(--accent2)",
              fontSize: 14, cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
