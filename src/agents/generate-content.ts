/**
 * CONTENT GENERATOR AGENT (Sonnet 4.6)
 *
 * Generates LinkedIn content ideas with the full required field set:
 * title, hook, coreArgument, whyNow, sourceEvidence, timPOV, colRelevance,
 * supportingPoints, risk, body. Voice = sharp/stylish/commercial/witty.
 */
import { z } from "zod";
import { anthropic, MODELS } from "../lib/anthropic";
import { cachedSystem, getCampaignContext } from "../lib/context";
import { store, cuid, nowIso, type ContentIdea } from "../lib/store";

const DraftSchema = z.object({
  title: z.string(),
  hook: z.string(),
  coreArgument: z.string(),
  whyNow: z.string(),
  sourceEvidence: z.string(),
  timPOV: z.string(),
  colRelevance: z.string(),
  supportingPoints: z.array(z.string()).min(1).max(7),
  risk: z.string().optional(),
  body: z.string(),
  format: z.enum(["post", "article", "thread", "newsletter", "reply", "comment"]),
  rationale: z.string(),
  predictedEngagement: z.enum(["low", "medium", "high"]),
});

const BatchSchema = z.object({ drafts: z.array(DraftSchema).min(1).max(5) });

const INSTRUCTIONS = `
You are Tim's ghostwriter. Write LinkedIn content in HIS voice.

VOICE TARGET: sharp, stylish, commercial, witty, plugged in, opinionated, media-native,
confident without arrogant, global but not vague, operator-led not influencer-led.

AVOID (will cause low-value rejection):
- Generic AI commentary
- Generic entertainment news summaries
- Corporate CMO language
- Press-release tone
- Empty founder wisdom
- Overclaiming COL's position
- Invented anecdotes (every personal claim must be supported by Tim's actual history)
- Fake certainty
- Forced jokes
- "Visionary leader" phrasing
- Opening with "I'm excited", "Thrilled", "Honored"
- "leverage", "synergies", "ecosystem", "game-changer"
- Hashtag spam

Generate 3 drafts. Each MUST include ALL these fields in strict JSON:

{
  "drafts": [
    {
      "title": "short internal label (not the post hook)",
      "hook": "the opening line of the post, under 14 words",
      "coreArgument": "the central claim in ONE sentence",
      "whyNow": "the time peg — what news or moment makes this timely?",
      "sourceEvidence": "links + receipts. Cite URLs from the news block. If using Tim's own data (238M views, 77min sessions, etc.), cite the metric explicitly.",
      "timPOV": "Tim's specific, opinionated take. Not the obvious read. What does Tim see that others don't?",
      "colRelevance": "how this post serves COL's positioning",
      "supportingPoints": ["bullet 1", "bullet 2", "..."],
      "risk": "what could go wrong (Tim's tone, COL's exposure, an audience misreading). Omit only if genuinely no risk.",
      "body": "the full draft. 120-280 words. Short sentences. White space between ideas. Specific names, specific numbers.",
      "format": "post | article | thread | newsletter | reply | comment",
      "rationale": "why this will work (1-2 sentences)",
      "predictedEngagement": "low | medium | high"
    }
  ]
}

THREE DISTINCT SHAPES:

Draft #1 — DATA-LED COUNTER-INTUITIVE
- Open with a real number from Tim's metrics (238M views in a day, 77min sessions, ~20% AU payment rate, 1,700+ titles, USD 1M+ revenue in 6mo).
- coreArgument: an insight that contradicts the obvious read of that number.
- Sourcing: cite the metric. Don't invent new metrics.

Draft #2 — CONTRARIAN INDUSTRY TAKE
- Pushback on a common assumption in the news block.
- Anchored on Vertical 2.0 thesis, "not saving Hollywood", or behavioural-shift framing.
- Ends inviting debate, not closure.

Draft #3 — PERSONAL VULNERABILITY + PROFESSIONAL ANCHOR
- A specific moment from Tim's actual history (Singapore upbringing, Microgaming Taipei years, COL year one, the CMO promotion, the health scare). Don't invent.
- Tied to a category insight.

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
        `- [${i.source}, ${i.publishedAt?.slice(0, 10) ?? "?"}] ${i.title}\n  ${i.aiSummary ?? i.rawSummary ?? ""}\n  Angle: ${i.hook ?? "n/a"}\n  ${i.url}`
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
        `- [${i.source}, ${i.publishedAt?.slice(0, 10) ?? "?"}] ${i.title}\n  ${i.aiSummary ?? ""}\n  Angle: ${i.hook ?? "n/a"}\n  ${i.url}`
      )
      .join("\n\n");
  }

  const userText = [
    campaign ? `Campaign context:\n${campaign}\n` : "",
    opts?.topic ? `Topic Tim asked for: ${opts.topic}\n` : "",
    "News hooks available as time pegs (cite if used):",
    newsBlock || "(no fresh news — write evergreen drafts anchored on Tim's core theses; whyNow can reference his CMO appointment or the LA trip)",
  ].join("\n");

  const resp = await anthropic.messages.create({
    model: MODELS.reasoning,
    max_tokens: 4000,
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
    title: d.title,
    hook: d.hook,
    coreArgument: d.coreArgument,
    whyNow: d.whyNow,
    sourceEvidence: d.sourceEvidence,
    timPOV: d.timPOV,
    colRelevance: d.colRelevance,
    supportingPoints: d.supportingPoints,
    risk: d.risk,
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
