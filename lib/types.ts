/** Shared types used across InsightsPanel, CardChatDrawer, and API routes */

export type CardType = "concept" | "insight" | "warning" | "quote" | "stat" | "summary";

export type Card = {
  id: string;
  type: CardType;
  title: string;
  body: string;
  tags?: string[];
  emphasis?: string | null;
};

export type InsightData = {
  summary: string;
  cards: Card[];
  topics: string[];
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  id: string;
};
