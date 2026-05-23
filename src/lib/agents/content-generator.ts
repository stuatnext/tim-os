/**
 * CONTENT GENERATOR AGENT (Sonnet 4.6)
 *
 * Generates LinkedIn post drafts in Tim's voice. Inputs:
 *   - the week's top-relevance IndustryItems (news hooks)
 *   - Tim's voice bank (cached)
 *   - this week's focus from Settings
 *
 * Output: 3 drafts of different shapes (data-led, contrarian, vulnerability+anchor)
 * persisted as ContentIdea rows. Tim reviews → approves → posts.
 */
import { z } from "zod";
import { prisma } from "../prisma";
import { anthropic, MODELS } from "../anthropic";
import { cachedSystem, getCampaignContext } from "../context";

const DraftSchema = z.object({
  hook: z.string(),
  body: z.string(),
  format: z.enum(["post", "article", "thread", "newsletter", "reply"]),
  rationale: z.string(),
  predictedEngagement: z.enum(["low", "medium", "high"]),
});

const BatchSchema = z.object({ drafts: z.array(DraftSchema).min(1).max(5) });

const INSTRUCTIONS = `
You are Tim's ghostwriter. You write LinkedIn posts in HIS voice — direct, anti-fluff,
specific, often opening with a number or a one-line claim, mixing personal vulnerability
with professional insight.

Generate 3 distinct drafts in strict JSON:
{
  "drafts": [
    {
      "hook": "the opening line (under 14 words)",
      "body": "the full post — 120-280 words, line breaks between ideas",
      "format": "post" | "thread" | "newsletter" | "article" | "reply",
      "rationale": "why this will work for Tim's audience (1-2 sentences)",
      "predictedEngagement": "low" | "medium" | "high"
    }
  ]
}

Draft #1 — DATA-LED COUNTER-INTUITIVE
- Open with a number from Tim's actual metrics.
- Then "here's what it actually means" — Tim's unique insight, not the obvious read.

Draft #2 — CONTRARIAN INDUSTRY TAKE
- Pushback on a common assumption. Anchored on Vertical 2.0 or "we're not saving Hollywood".
- Ends inviting debate.

Draft #3 — PERSONAL VULNERABILITY + PROFESSIONAL ANCHOR
- A specific moment (a meeting, a flight, a feeling), tied to a category insight.
- His top-engagement format.

VOICE RULES (do not break):
- Never open with "I'm excited", "Thrilled to share", "Honored to".
- No hashtags unless the post is purely event-driven.
- Sentences short. White space between ideas.
- Specific names, specific numbers. Receipts always.
- If referencing news, link the URL inline.
- Avoid: "leverage", "synergies", "ecosystem", "game-changer".

Return JSON only.
`.trim();

export async function generateDrafts(opts?: { newsItemIds?: string[]; topic?: string }) {
  const campaign = await getCampaignContext();

  let newsBlock = "";
  let sourceIds: string[] = [];

  if (opts?.newsItemIds?.length) {
    const items = await prisma.industryItem.findMany({
      where: { id: { in: opts.newsItemIds } },
      take: 5,
    });
    sourceIds = items.map((i) => i.id);
    newsBlock = items
      .map(
        (i) =>
          `- [${i.source}] ${i.title}\n  ${i.aiSummary ?? i.rawSummary ?? ""}\n  Hook: ${i.hook ?? "n/a"}\n  URL: ${i.url}`
      )
      .join("\n\n");
  } else {
    // Otherwise grab the top 5 most-relevant unactioned items from the last 14 days.
    const recent = await prisma.industryItem.findMany({
      where: {
        status: "reviewed",
        publishedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { relevanceScore: "desc" },
      take: 5,
    });
    sourceIds = recent.map((i) => i.id);
    newsBlock = recent
      .map(
        (i) =>
          `- [${i.source}] ${i.title}\n  ${i.aiSummary ?? ""}\n  Hook: ${i.hook ?? "n/a"}\n  URL: ${i.url}`
      )
      .join("\n\n");
  }

  const userText = [
    campaign ? `Campaign context:\n${campaign}\n` : "",
    opts?.topic ? `Topic Tim asked for: ${opts.topic}\n` : "",
    "This week's news hooks (use as inspiration, not all 3 drafts need to react to news):",
    newsBlock || "(no fresh news this week — write 3 evergreen drafts on Tim's core theses)",
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

  const saved = [];
  for (const d of parsed.drafts) {
    const idea = await prisma.contentIdea.create({
      data: {
        platform: "linkedin",
        format: d.format,
        hook: d.hook,
        body: d.body,
        rationale: d.rationale,
        predictedEngagement: d.predictedEngagement,
        sourceItemId: sourceIds[0] ?? null,
        status: "draft",
      },
    });
    saved.push(idea);
  }

  return {
    drafts: saved,
    usage: {
      inputTokens: resp.usage.input_tokens,
      outputTokens: resp.usage.output_tokens,
      cacheReadTokens: resp.usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: resp.usage.cache_creation_input_tokens ?? 0,
    },
  };
}
