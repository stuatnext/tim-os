/**
 * WEEKLY BRIEF AGENT (Opus 4.7)
 *
 * The Monday artifact Tim opens. Produces strategist-grade synthesis covering
 * the 12 required dashboard outputs defined in CLAUDE.md.
 */
import { z } from "zod";
import { anthropic, MODELS } from "../lib/anthropic";
import { cachedSystem, getCampaignContext } from "../lib/context";
import { store, cuid, mondayOf, nowIso, type Brief } from "../lib/store";

const ScoreAxesSchema = z.object({
  timAuthorityFit: z.number().int().min(1).max(5),
  colCommercialUpside: z.number().int().min(1).max(5),
  microdramaRelevance: z.number().int().min(1).max(5),
  mediaCoveragePotential: z.number().int().min(1).max(5),
  relationshipValue: z.number().int().min(1).max(5),
  personalityFit: z.number().int().min(1).max(5),
  timeliness: z.number().int().min(1).max(5),
  evidenceStrength: z.number().int().min(1).max(5),
  easeOfAction: z.number().int().min(1).max(5),
  reputationRisk: z.number().int().min(1).max(5),
});

const ActionEnum = z.enum(["Act now", "Pitch", "Post", "Comment", "DM", "Watch", "Park", "Ignore"]);

const OpportunitySchema = z.object({
  title: z.string(),
  type: z.string(),
  why: z.string(),
  source: z.string().optional(),
  dateChecked: z.string().optional(),
  scores: ScoreAxesSchema,
  action: ActionEnum,
  evidence: z.enum(["strong", "moderate", "weak"]),
});

const RelationshipTargetSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  organisation: z.string().optional(),
  whyMatters: z.string(),
  source: z.string().optional(),
  timRelevance: z.string(),
  colRelevance: z.string(),
  bestApproach: z.string(),
  publicMove: z.string().optional(),
  privateMove: z.string().optional(),
  risk: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]),
});

const BriefSchema = z.object({
  headline: z.string(),
  whatChanged: z.string(),
  topOpportunities: z.array(OpportunitySchema).min(1).max(7),
  topPeople: z.array(RelationshipTargetSchema).min(1).max(7),
  bestMediaAngle: z.object({
    angle: z.string(),
    targetOutlet: z.string().optional(),
    why: z.string(),
    evidence: z.string(),
  }),
  bestLinkedInAngle: z.object({
    hook: z.string(),
    angle: z.string(),
    why: z.string(),
  }),
  bestCommentOpportunity: z.object({
    targetPostUrl: z.string().optional(),
    targetAuthor: z.string(),
    suggestedComment: z.string(),
    why: z.string(),
    risk: z.string(),
  }),
  bestRelationshipMove: RelationshipTargetSchema,
  bestColOpportunity: z.object({
    title: z.string(),
    why: z.string(),
    commercialUpside: z.string(),
    nextStep: z.string(),
  }),
  risingTrend: z.object({
    trend: z.string(),
    evidence: z.string(),
    implication: z.string(),
  }),
  thingToIgnore: z.object({
    item: z.string(),
    why: z.string(),
  }),
  reputationRisk: z.object({
    risk: z.string(),
    mitigation: z.string(),
  }),
  suggestedAction: z.object({
    for: z.enum(["Stuart", "Tim"]),
    action: z.string(),
    urgency: z.enum(["this-week", "this-month", "this-quarter"]),
  }),
});

const INSTRUCTIONS = `
You are Tim's chief of staff. Every Monday you produce the brief he opens with his
first coffee. He has 10 minutes. Your job: tell him what matters, in his voice,
with receipts.

You operate under the STRATEGIC OBJECTIVE in the system prompt. Re-read it: this
brief exists to position Tim as a vertical media mogul, an East-West bridge, a
commercial operator, and a media personality — not to produce generic content.

Return strict JSON matching exactly this shape:

{
  "headline": "ONE line. The strategic priority of the week. No throat-clearing.",

  "whatChanged": "150-250 words. What actually moved since last Monday: new deals, competitor announcements, Tim's appearances, audience-data shifts. Specific, named, dated. If nothing changed, say so honestly.",

  "topOpportunities": [
    {
      "title": "short label",
      "type": "podcast guest | panel | award | media interview | LinkedIn angle | comment | DM | platform relationship | investor narrative | creator collab | market signal | competitor move",
      "why": "1-2 sentences: why Tim, why now",
      "source": "URL or named reference (REQUIRED if making a public claim)",
      "dateChecked": "ISO date when the source was verified",
      "scores": {
        "timAuthorityFit": 1-5,
        "colCommercialUpside": 1-5,
        "microdramaRelevance": 1-5,
        "mediaCoveragePotential": 1-5,
        "relationshipValue": 1-5,
        "personalityFit": 1-5,
        "timeliness": 1-5,
        "evidenceStrength": 1-5,
        "easeOfAction": 1-5,
        "reputationRisk": 1-5
      },
      "action": "Act now | Pitch | Post | Comment | DM | Watch | Park | Ignore",
      "evidence": "strong | moderate | weak"
    }
    // 3-5 of these
  ],

  "topPeople": [
    {
      "name": "person",
      "role": "their role",
      "organisation": "their org",
      "whyMatters": "1-2 sentences",
      "source": "URL or named reference",
      "timRelevance": "specific connection to Tim's positioning",
      "colRelevance": "specific connection to COL's commercial goals",
      "bestApproach": "the recommended way in",
      "publicMove": "a public way to engage (comment, repost, tag, panel)",
      "privateMove": "a private way (DM, warm intro, email)",
      "risk": "what could go wrong if any",
      "priority": "high | medium | low"
    }
    // 3-5 of these
  ],

  "bestMediaAngle": {
    "angle": "the specific story Tim should be the source for",
    "targetOutlet": "named outlet or journalist if known",
    "why": "why this lands now",
    "evidence": "what makes Tim the obvious source"
  },

  "bestLinkedInAngle": {
    "hook": "the opening line under 14 words",
    "angle": "the central argument",
    "why": "why it lands with Tim's audience"
  },

  "bestCommentOpportunity": {
    "targetPostUrl": "URL of the post Tim should engage with (if known)",
    "targetAuthor": "who posted it",
    "suggestedComment": "the actual comment Tim should leave — sharp, specific, in his voice",
    "why": "why commenting here is valuable",
    "risk": "what to watch — politics, tone, audience"
  },

  "bestRelationshipMove": { /* same shape as topPeople item */ },

  "bestColOpportunity": {
    "title": "the commercial play",
    "why": "why now",
    "commercialUpside": "specific business outcome",
    "nextStep": "exact action"
  },

  "risingTrend": {
    "trend": "the signal",
    "evidence": "what's driving it (named, dated)",
    "implication": "what it means for COL/Tim"
  },

  "thingToIgnore": {
    "item": "what you considered and rejected",
    "why": "why it's noise"
  },

  "reputationRisk": {
    "risk": "the specific exposure",
    "mitigation": "concrete defence"
  },

  "suggestedAction": {
    "for": "Stuart | Tim",
    "action": "the single most important thing to do",
    "urgency": "this-week | this-month | this-quarter"
  }
}

RULES (HARD):
- Never invent journalist interest, quotes, or relationships. If you don't have evidence, mark evidence="weak" and say so.
- Always cite sources for public claims (URL or named reference).
- Separate facts (in the data we gave you), inference (your reasoning), and recommended action (what Tim should do).
- Reputation risk axis: 1 = no risk, 5 = serious risk. Score honestly. Don't downgrade real risk.
- Action verbs only. "Send X to Y" not "explore opportunities with Y".
- If an item's evidence strength is <=2, classify action as "Watch" or lower.
- Do NOT use: "leverage", "synergies", "ecosystem", "game-changer", "visionary leader", "thrilled", "excited".

Return JSON only.
`.trim();

function summariseBrief(b: Brief): string {
  return [
    `Last week's headline: ${b.headline}`,
    `Last week's focus: ${b.suggestedAction?.action ?? "n/a"}`,
    `Top opportunity titles last week: ${b.topOpportunities?.map((o) => o.title).join("; ")}`,
    `What changed last week: ${b.whatChanged?.slice(0, 400)}`,
  ].join("\n");
}

export async function generateWeeklyBrief() {
  const weekOf = mondayOf();
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const thirtyDaysOut = Date.now() + 30 * 24 * 60 * 60 * 1000;

  const [news, awards, speaking, contacts, briefs, content] = await Promise.all([
    store.getIntelligence(),
    store.getAwards(),
    store.getSpeaking(),
    store.getContacts(),
    store.getBriefs(),
    store.getContent(),
  ]);

  const previousBrief = briefs.find((b) => b.weekOf !== weekOf);

  const relevantNews = news
    .filter(
      (n) =>
        n.status === "reviewed" &&
        n.publishedAt &&
        new Date(n.publishedAt).getTime() >= fourteenDaysAgo
    )
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
    .slice(0, 15);

  const nearAwards = awards
    .filter(
      (a) =>
        ["identified", "drafted"].includes(a.status) &&
        a.deadline &&
        new Date(a.deadline).getTime() >= Date.now() &&
        new Date(a.deadline).getTime() <= thirtyDaysOut
    )
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 10);

  const nearSpeaking = speaking
    .filter(
      (s) =>
        s.startsAt &&
        new Date(s.startsAt).getTime() >= Date.now() &&
        new Date(s.startsAt).getTime() <= thirtyDaysOut
    )
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime())
    .slice(0, 10);

  const recentContent = content.slice(0, 6);
  const topContacts = contacts.filter((c) => c.tier === 1 || c.tier === 2).slice(0, 30);
  const campaign = await getCampaignContext();

  const newsBlock = relevantNews.length
    ? relevantNews
        .map(
          (n) =>
            `- [${n.source}, score ${n.relevanceScore ?? "?"}, ${n.publishedAt?.slice(0, 10) ?? "?"}] ${n.title}\n  ${n.aiSummary ?? n.rawSummary ?? ""}\n  Angle: ${n.hook ?? "n/a"}\n  ${n.url}`
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

  const contentBlock = recentContent.length
    ? recentContent
        .map((c) => `- [${c.status}] "${c.hook}" — ${c.title ?? c.format}`)
        .join("\n")
    : "(no recent content drafts)";

  const previousBlock = previousBrief
    ? `\n== PREVIOUS BRIEF (for "what changed" diff) ==\n${summariseBrief(previousBrief)}\n`
    : "";

  const userText = `
${campaign ? `Campaign context:\n${campaign}\n` : ""}
${previousBlock}
== INDUSTRY (last 14 days, top relevance) ==
${newsBlock}

== AWARDS (next 30 days) ==
${awardsBlock}

== SPEAKING (next 30 days) ==
${speakingBlock}

== RELATIONSHIPS (T1-T2) ==
${contactBlock}

== RECENT CONTENT DRAFTS ==
${contentBlock}

Produce this week's brief.
`.trim();

  const resp = await anthropic.messages.create({
    model: MODELS.strategy,
    max_tokens: 8000,
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
    ...parsed,
    topOpportunities: parsed.topOpportunities,
    topPeople: parsed.topPeople,
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
