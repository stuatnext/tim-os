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
import { store } from "./store";

export type CachedSystemBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
};

export function cachedSystem(agentInstructions: string): CachedSystemBlock[] {
  return [
    {
      type: "text",
      text:
        "You are the strategic AI partner running 'Tim OS' — a brand and opportunity dashboard for Timothy Oh, " +
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
 * Pull Tim's current campaign context (this week's focus, quarter goals,
 * voice tuning notes) and format as a user-message preamble.
 */
export async function getCampaignContext() {
  const settings = await store.getSettings();
  const lines: string[] = [];
  if (settings.weeklyFocus) lines.push(`This week's focus: ${settings.weeklyFocus}`);
  if (settings.campaignGoals.thisQuarter.length) {
    lines.push(`This quarter: ${settings.campaignGoals.thisQuarter.join("; ")}`);
  }
  if (settings.voiceTuning) lines.push(`Voice tuning notes: ${settings.voiceTuning}`);
  return lines.join("\n");
}
