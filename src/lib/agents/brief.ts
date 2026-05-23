/**
 * WEEKLY BRIEF AGENT (Opus 4.7)
 *
 * The artifact Tim opens on Monday morning. Produces a strategist-grade
 * synthesis of:
 *   - the week's industry intelligence
 *   - upcoming awards / speaking / pitches
 *   - relationship moves to make
 *   - 3 content ideas to post this week
 *
 * Saves to Brief table, indexed by the Monday of the week.
 */
import { z } from "zod";
import { prisma } from "../prisma";
import { anthropic, MODELS } from "../anthropic";
import { cachedSystem, getCampaignContext } from "../context";

const ActionSchema = z.object({
  title: z.string(),
  why: z.string(),
  deadline: z.string().optional(),
});

const ContentSuggestionSchema = z.object({
  hook: z.string(),
  angle: z.string(),
  predictedEngagement: z.enum(["low", "medium", "high"]),
});

const RelationshipMoveSchema = z.object({
  person: z.string(),
  move: z.string(),
  why: z.string(),
});

const BriefSchema = z.object({
  headline: z.string(),
  industryDigest: z.string(),
  topActions: z.array(ActionSchema).min(1).max(5),
  contentToPost: z.array(ContentSuggestionSchema).min(1).max(4),
  relationshipMoves: z.array(RelationshipMoveSchema).min(1).max(4),
  opportunityFocus: z.object({
    name: z.string(),
    why: z.string(),
    nextStep: z.string(),
  }),
});

const INSTRUCTIONS = `
You are Tim's chief of staff. Every Monday you produce the brief he opens with his
first coffee. He has 10 minutes. Your job: tell him what matters, in his voice,
with receipts.

Return strict JSON matching:
{
  "headline": "one line that captures the week's strategic priority",
  "industryDigest": "200-350 words. The 3-5 most important stories this week and what they mean for Tim's positioning. Specific, named, dated. No fluff.",
  "topActions": [
    { "title": "...", "why": "...", "deadline": "ISO date or null" }
  ],
  "contentToPost": [
    { "hook": "post opener under 14 words", "angle": "what it argues", "predictedEngagement": "low|medium|high" }
  ],
  "relationshipMoves": [
    { "person": "name", "move": "specific action", "why": "strategic value" }
  ],
  "opportunityFocus": {
    "name": "the single most important opportunity this week",
    "why": "why it's the focus",
    "nextStep": "the exact next action"
  }
}

Rules:
- Be specific, not generic. "Send the Belloni email" not "explore podcast options".
- Anchor every recommendation in Tim's existing positioning (Vertical 2.0, 238M views, distribution-as-infrastructure).
- If an opportunity's deadline is within 7 days, it MUST appear in topActions.
- For content, suggest hooks that DON'T start with "I'm excited" or hashtags.

Return JSON only.
`.trim();

function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function generateWeeklyBrief() {
  const weekOf = mondayOf();

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [news, awards, speaking, contacts] = await Promise.all([
    prisma.industryItem.findMany({
      where: {
        status: "reviewed",
        publishedAt: { gte: fourteenDaysAgo },
      },
      orderBy: [{ relevanceScore: "desc" }, { publishedAt: "desc" }],
      take: 12,
    }),
    prisma.award.findMany({
      where: { status: { in: ["identified", "drafted"] }, deadline: { gte: new Date(), lte: thirtyDaysOut } },
      orderBy: { deadline: "asc" },
      take: 8,
    }),
    prisma.speakingEvent.findMany({
      where: { startsAt: { gte: new Date(), lte: thirtyDaysOut } },
      orderBy: { startsAt: "asc" },
      take: 8,
    }),
    prisma.contact.findMany({ where: { tier: { in: [1, 2] } }, take: 25 }),
  ]);

  const campaign = await getCampaignContext();

  const newsBlock = news.length
    ? news
        .map(
          (n) =>
            `- [${n.source}, score ${n.relevanceScore ?? "?"}] ${n.title}\n  ${n.aiSummary ?? n.rawSummary ?? ""}\n  Hook: ${n.hook ?? "n/a"}\n  ${n.url}`
        )
        .join("\n\n")
    : "(no fresh news this week)";

  const awardsBlock = awards.length
    ? awards
        .map(
          (a) =>
            `- ${a.name} (${a.priority}, fit ${a.fitScore ?? "?"}) — deadline ${a.deadline?.toISOString().slice(0, 10) ?? "n/a"}\n  ${a.fitRationale ?? a.notes ?? ""}`
        )
        .join("\n")
    : "(no near-term award deadlines)";

  const speakingBlock = speaking.length
    ? speaking
        .map(
          (s) =>
            `- ${s.name} — ${s.startsAt?.toISOString().slice(0, 10) ?? "TBD"} — ${s.location ?? ""} (${s.status})`
        )
        .join("\n")
    : "(no near-term speaking)";

  const contactBlock = contacts
    .map((c) => `- T${c.tier} ${c.name} (${c.role ?? ""} @ ${c.company ?? ""}) — ${c.strategicValue ?? ""}`)
    .join("\n");

  const userText = `
${campaign ? `Campaign context:\n${campaign}\n` : ""}

== INDUSTRY (last 14 days, top relevance) ==
${newsBlock}

== AWARDS (next 30 days) ==
${awardsBlock}

== SPEAKING (next 30 days) ==
${speakingBlock}

== RELATIONSHIPS (T1-T2) ==
${contactBlock}

Produce the Monday brief.
`.trim();

  const resp = await anthropic.messages.create({
    model: MODELS.strategy,
    max_tokens: 3500,
    system: cachedSystem(INSTRUCTIONS),
    messages: [{ role: "user", content: userText }],
  });

  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No brief content from model");
  const raw = block.text.replace(/```json|```/g, "").trim();

  const parsed = BriefSchema.parse(JSON.parse(raw));

  const brief = await prisma.brief.upsert({
    where: { weekOf },
    update: {
      headline: parsed.headline,
      industryDigest: parsed.industryDigest,
      topActions: JSON.stringify(parsed.topActions),
      contentToPost: JSON.stringify(parsed.contentToPost),
      relationshipMoves: JSON.stringify(parsed.relationshipMoves),
      opportunityFocus: JSON.stringify(parsed.opportunityFocus),
      rawModel: MODELS.strategy,
      inputTokens: resp.usage.input_tokens,
      outputTokens: resp.usage.output_tokens,
      cacheReadTokens: resp.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: resp.usage.cache_creation_input_tokens ?? 0,
    },
    create: {
      weekOf,
      headline: parsed.headline,
      industryDigest: parsed.industryDigest,
      topActions: JSON.stringify(parsed.topActions),
      contentToPost: JSON.stringify(parsed.contentToPost),
      relationshipMoves: JSON.stringify(parsed.relationshipMoves),
      opportunityFocus: JSON.stringify(parsed.opportunityFocus),
      rawModel: MODELS.strategy,
      inputTokens: resp.usage.input_tokens,
      outputTokens: resp.usage.output_tokens,
      cacheReadTokens: resp.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: resp.usage.cache_creation_input_tokens ?? 0,
    },
  });

  return brief;
}
