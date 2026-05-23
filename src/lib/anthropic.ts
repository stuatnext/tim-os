import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY && process.env.NODE_ENV === "production") {
  // Warn loudly but don't crash — local seed/test paths don't need it.
  console.warn("ANTHROPIC_API_KEY not set — AI agents will fail at runtime.");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

/**
 * Model selection by task. We use prompt caching everywhere — the Tim profile
 * and voice bank are large and stable across calls.
 *
 * - INGESTION  (Haiku): fast, cheap, summarising a single news item.
 * - REASONING  (Sonnet): scoring, ranking, drafting content.
 * - STRATEGY   (Opus):  weekly brief — the artifact Tim actually reads.
 */
export const MODELS = {
  ingestion: "claude-haiku-4-5-20251001",
  reasoning: "claude-sonnet-4-6",
  strategy: "claude-opus-4-7",
} as const;

export type ModelKey = keyof typeof MODELS;
