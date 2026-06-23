import type { CardType } from "./types";

/** Shared visual style map for card types — single source of truth */
export const TYPE_STYLES: Record<
  CardType,
  { icon: string; border: string; badge: string; badgeText: string }
> = {
  concept: { icon: "💡", border: "var(--accent)",  badge: "rgba(124,106,247,0.15)", badgeText: "var(--accent2)" },
  insight: { icon: "🔍", border: "var(--green)",   badge: "rgba(52,211,153,0.12)",  badgeText: "var(--green)"   },
  warning: { icon: "⚠️", border: "var(--amber)",   badge: "rgba(251,191,36,0.12)",  badgeText: "var(--amber)"   },
  quote:   { icon: "💬", border: "var(--text3)",   badge: "rgba(255,255,255,0.05)", badgeText: "var(--text2)"   },
  stat:    { icon: "📊", border: "#60a5fa",        badge: "rgba(96,165,250,0.12)",  badgeText: "#93c5fd"        },
  summary: { icon: "📋", border: "#f472b6",        badge: "rgba(244,114,182,0.12)", badgeText: "#f9a8d4"        },
};
