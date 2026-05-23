/**
 * Builds the cached system prompt — the static block that every agent reuses.
 *
 * Anthropic's prompt caching kicks in when we mark a system block with
 * `cache_control: { type: "ephemeral" }`. The Tim profile + voice bank are
 * the obvious candidates: large, stable, used by every call.
 *
 * On subsequent calls within the cache TTL (~5 min) we pay 10% of input cost
 * for those tokens. On Opus this is the difference between sustainable and
 * silly.
 */
import { TIM_PROFILE } from "./data/tim-profile";
import { VOICE_BANK } from "./data/voice-bank";

export type CachedSystemBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
};

/**
 * The Tim-OS-wide cached system prompt. Returned as an array so we can pass
 * it directly to `messages.create({ system: cachedSystem(...) })`.
 */
export function cachedSystem(agentInstructions: string): CachedSystemBlock[] {
  return [
    {
      type: "text",
      text:
        "You are the strategic AI partner running 'Tim OS' — a live brand and opportunity dashboard for Timothy Oh, " +
        "Global CMO & GM of COL Group International. Tim's profile follows. Treat it as your ground truth.",
    },
    {
      type: "text",
      text: TIM_PROFILE,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: VOICE_BANK,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: agentInstructions.trim(),
    },
  ];
}

/**
 * Helper: pull the most recent Settings row (or null). Agents that adapt to
 * Tim's current weekly focus read this and prepend it to their user message.
 */
export async function getCampaignContext() {
  const { prisma } = await import("./prisma");
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  if (!settings) return "";
  const lines: string[] = [];
  if (settings.weeklyFocus) lines.push(`This week's focus: ${settings.weeklyFocus}`);
  if (settings.campaignGoals) {
    try {
      const goals = JSON.parse(settings.campaignGoals);
      if (goals.thisQuarter?.length) lines.push(`This quarter: ${goals.thisQuarter.join("; ")}`);
    } catch {
      /* tolerate malformed JSON */
    }
  }
  if (settings.voiceTuning) lines.push(`Voice tuning notes: ${settings.voiceTuning}`);
  return lines.join("\n");
}
