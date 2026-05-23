/**
 * WEEKLY BRIEF AGENT (Opus 4.7)
 *
 * The Monday artifact Tim opens. Produces strategist-grade synthesis of
 * intelligence + opportunities + relationships into a structured brief.
 */
import { z } from "zod";
import { anthropic, MODELS } from "../lib/anthropic";
import { cachedSystem, getCampaignContext } from "../lib/context";
import { store, cuid, mondayOf, nowIso, type Brief } from "../lib/store";

const BriefSchema = z.object({
  headline: z.string(),
  industryDigest: z.string(),
  topActions: z
    .array(z.object({ title: z.string(), why: z.string(), deadline: z.string().optional() }))
    .min(1)
    .max(5),
  contentToPost: z
    .array(
      z.object({
        hook: z.string(),
        angle: z.string(),
        predictedEngagement: z.enum(["low", "medium", "high"]),
      })
    )
    .min(1)
    .max(4),
  relationshipMoves: z
    .array(z.object({ person: z.string(), move: z.string(), why: z.string() }))
    .min(1)
    .max(4),
  opportunityFocus: z.object({ name: z.string(), why: z.string(), nextStep: z.string() }),
});

const INSTRUCTIONS = `
You are Tim's chief of staff. Every Monday you produce the brief he opens with his first coffee.
He has 10 minutes. Your job: tell him what matters, in his voice, with receipts.

Return strict JSON:
{
  "headline": "one line capturing the week's strategic priority",
  "industryDigest": "200-350 words. The 3-5 most important stories and what they mean for Tim. Specific, named, dated. No fluff.",
  "topActions": [{ "title": "...", "why": "...", "deadline": "ISO date or null" }],
  "contentToPost": [{ "hook": "post opener <14 words", "angle": "what it argues", "predictedEngagement": "low|medium|high" }],
  "relationshipMoves": [{ "person": "name", "move": "specific action", "why": "strategic value" }],
  "opportunityFocus": { "name": "single most important", "why": "...", "nextStep": "exact next action" }
}

Rules:
- Specific, not generic. "Send the Belloni email" not "explore podcast options".
- Anchor every recommendation in Tim's positioning (Vertical 2.0, 238M views, distribution-as-infrastructure).
- If a deadline is within 7 days, it MUST appear in topActions.
- Content hooks DON'T start with "I'm excited" or hashtags.

Return JSON only.
`.trim();

export async function generateWeeklyBrief() {
  const weekOf = mondayOf();
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const thirtyDaysOut = Date.now() + 30 * 24 * 60 * 60 * 1000;

  const [news, awards, speaking, contacts] = await Promise.all([
    store.getIntelligence(),
    store.getAwards(),
    store.getSpeaking(),
    store.getContacts(),
  ]);

  const relevantNews = news
    .filter(
      (n) =>
        n.status === "reviewed" &&
        n.publishedAt &&
        new Date(n.publishedAt).getTime() >= fourteenDaysAgo
    )
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
    .slice(0, 12);

  const nearAwards = awards
    .filter(
      (a) =>
        ["identified", "drafted"].includes(a.status) &&
        a.deadline &&
        new Date(a.deadline).getTime() >= Date.now() &&
        new Date(a.deadline).getTime() <= thirtyDaysOut
    )
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 8);

  const nearSpeaking = speaking
    .filter(
      (s) =>
        s.startsAt &&
        new Date(s.startsAt).getTime() >= Date.now() &&
        new Date(s.startsAt).getTime() <= thirtyDaysOut
    )
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime())
    .slice(0, 8);

  const topContacts = contacts.filter((c) => c.tier === 1 || c.tier === 2).slice(0, 25);

  const campaign = await getCampaignContext();

  const newsBlock = relevantNews.length
    ? relevantNews
        .map(
          (n) =>
            `- [${n.source}, score ${n.relevanceScore ?? "?"}] ${n.title}\n  ${n.aiSummary ?? n.rawSummary ?? ""}\n  Hook: ${n.hook ?? "n/a"}\n  ${n.url}`
        )
        .join("\n\n")
    : "(no fresh news this week)";

  const awardsBlock = nearAwards.length
    ? nearAwards
        .map(
          (a) =>
            `- ${a.name} (${a.priority}, fit ${a.fitScore ?? "?"}) — deadline ${a.deadline?.slice(0, 10) ?? "n/a"}\n  ${a.fitRationale ?? a.notes ?? ""}`
        )
        .join("\n")
    : "(no near-term award deadlines)";

  const speakingBlock = nearSpeaking.length
    ? nearSpeaking
        .map(
          (s) =>
            `- ${s.name} — ${s.startsAt?.slice(0, 10) ?? "TBD"} — ${s.location ?? ""} (${s.status})`
        )
        .join("\n")
    : "(no near-term speaking)";

  const contactBlock = topContacts
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

  const brief: Brief = {
    id: cuid(),
    weekOf,
    headline: parsed.headline,
    industryDigest: parsed.industryDigest,
    topActions: parsed.topActions,
    contentToPost: parsed.contentToPost,
    relationshipMoves: parsed.relationshipMoves,
    opportunityFocus: parsed.opportunityFocus,
    model: MODELS.strategy,
    tokens: {
      input: resp.usage.input_tokens,
      output: resp.usage.output_tokens,
      cacheRead: resp.usage.cache_read_input_tokens ?? 0,
      cacheWrite: resp.usage.cache_creation_input_tokens ?? 0,
    },
    createdAt: nowIso(),
  };

  await store.upsertBrief(brief);
  return brief;
}
