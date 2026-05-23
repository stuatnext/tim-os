/**
 * CONTENT GENERATOR AGENT (Sonnet 4.6)
 *
 * Generates LinkedIn post drafts in Tim's voice. Three drafts:
 *   - data-led counter-intuitive
 *   - contrarian industry take
 *   - personal vulnerability + professional anchor
 */
import { z } from "zod";
import { anthropic, MODELS } from "../lib/anthropic";
import { cachedSystem, getCampaignContext } from "../lib/context";
import { store, cuid, nowIso, type ContentIdea } from "../lib/store";

const DraftSchema = z.object({
  hook: z.string(),
  body: z.string(),
  format: z.enum(["post", "article", "thread", "newsletter", "reply"]),
  rationale: z.string(),
  predictedEngagement: z.enum(["low", "medium", "high"]),
});

const BatchSchema = z.object({ drafts: z.array(DraftSchema).min(1).max(5) });

const INSTRUCTIONS = `
You are Tim's ghostwriter. Write LinkedIn posts in HIS voice — direct, anti-fluff,
specific, opening with a number or one-line claim, mixing personal vulnerability
with professional insight.

Generate 3 distinct drafts in strict JSON:
{
  "drafts": [
    {
      "hook": "the opening line (under 14 words)",
      "body": "the full post — 120-280 words, line breaks between ideas",
      "format": "post",
      "rationale": "why this will work (1-2 sentences)",
      "predictedEngagement": "low" | "medium" | "high"
    }
  ]
}

Draft #1 — DATA-LED COUNTER-INTUITIVE
- Open with a number from Tim's actual metrics.
- "Here's what it actually means" — Tim's unique insight, not the obvious read.

Draft #2 — CONTRARIAN INDUSTRY TAKE
- Pushback on a common assumption. Anchored on Vertical 2.0 or "not saving Hollywood".
- Ends inviting debate.

Draft #3 — PERSONAL VULNERABILITY + PROFESSIONAL ANCHOR
- A specific moment (meeting, flight, feeling), tied to a category insight.
- His top-engagement format.

VOICE RULES:
- Never open with "I'm excited", "Thrilled", "Honored".
- No hashtags unless purely event-driven.
- Sentences short. White space between ideas.
- Specific names, specific numbers. Receipts always.
- Avoid: "leverage", "synergies", "ecosystem", "game-changer".

Return JSON only.
`.trim();

export async function generateDrafts(opts?: { newsItemIds?: string[]; topic?: string }) {
  const campaign = await getCampaignContext();
  const allItems = await store.getIntelligence();

  let newsBlock = "";
  let sourceItemId: string | undefined;

  if (opts?.newsItemIds?.length) {
    const items = allItems.filter((x) => opts.newsItemIds!.includes(x.id)).slice(0, 5);
    sourceItemId = items[0]?.id;
    newsBlock = items
      .map((i) =>
        `- [${i.source}] ${i.title}\n  ${i.aiSummary ?? i.rawSummary ?? ""}\n  Hook: ${i.hook ?? "n/a"}\n  URL: ${i.url}`
      )
      .join("\n\n");
  } else {
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recent = allItems
      .filter(
        (x) =>
          x.status === "reviewed" &&
          x.publishedAt &&
          new Date(x.publishedAt).getTime() >= cutoff
      )
      .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
      .slice(0, 5);
    sourceItemId = recent[0]?.id;
    newsBlock = recent
      .map((i) =>
        `- [${i.source}] ${i.title}\n  ${i.aiSummary ?? ""}\n  Hook: ${i.hook ?? "n/a"}\n  URL: ${i.url}`
      )
      .join("\n\n");
  }

  const userText = [
    campaign ? `Campaign context:\n${campaign}\n` : "",
    opts?.topic ? `Topic Tim asked for: ${opts.topic}\n` : "",
    "News hooks (use as inspiration; not all 3 drafts need to react to news):",
    newsBlock || "(no fresh news — write evergreen drafts on Tim's core theses)",
  ].join("\n");

  const resp = await anthropic.messages.create({
    model: MODELS.reasoning,
    max_tokens: 2400,
    system: cachedSystem(INSTRUCTIONS),
    messages: [{ role: "user", content: userText }],
  });

  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No content from model");
  const raw = block.text.replace(/```json|```/g, "").trim();
  const parsed = BatchSchema.parse(JSON.parse(raw));

  const existing = await store.getContent();
  const newDrafts: ContentIdea[] = parsed.drafts.map((d) => ({
    id: cuid(),
    platform: "linkedin",
    format: d.format,
    hook: d.hook,
    body: d.body,
    rationale: d.rationale,
    predictedEngagement: d.predictedEngagement,
    sourceItemId,
    status: "draft",
    createdAt: nowIso(),
  }));

  await store.setContent([...newDrafts, ...existing]);
  return {
    drafts: newDrafts,
    usage: {
      inputTokens: resp.usage.input_tokens,
      outputTokens: resp.usage.output_tokens,
      cacheReadTokens: resp.usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: resp.usage.cache_creation_input_tokens ?? 0,
    },
  };
}
