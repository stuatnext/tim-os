/**
 * OPPORTUNITY RANKER (Sonnet 4.6)
 *
 * Re-scores awards, speaking events, and media targets using the 10-axis
 * scoring model and the 8-class action classifier. Writes back fitScore
 * (a simple 0-100 aggregate of the axes) plus a fitRationale and action.
 */
import { z } from "zod";
import { anthropic, MODELS } from "../lib/anthropic";
import { cachedSystem, getCampaignContext } from "../lib/context";
import { store } from "../lib/store";

const ScoreSchema = z.object({
  scores: z.object({
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
  }),
  action: z.enum(["Act now", "Pitch", "Post", "Comment", "DM", "Watch", "Park", "Ignore"]),
  rationale: z.string(),
  priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
});

const INSTRUCTIONS = `
You re-score an opportunity for Tim's campaign using the STRATEGIC OBJECTIVE in the
system prompt. Apply the 10-axis 1-5 scoring model and choose ONE action from the
8-class classifier.

Return strict JSON:
{
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
    "reputationRisk": 1-5   // 1 = no risk, 5 = serious risk (do not downplay)
  },
  "action": "Act now | Pitch | Post | Comment | DM | Watch | Park | Ignore",
  "rationale": "1-2 sentences: why this matters for Tim right now",
  "priority": "urgent | high | medium | low"   // optional
}

ACTION CLASSIFIER:
- Act now: execute this week
- Pitch: formal outreach (award entry, speaker application, journalist pitch)
- Post: public LinkedIn content
- Comment: engage on someone else's content
- DM: private message
- Watch: monitor, no action yet
- Park: keep, revisit later
- Ignore: skip

PRIORITY:
- urgent: deadline <14 days AND aggregate score (sum of positive axes) >= 32
- high: aggregate >= 35
- medium: aggregate 22-34
- low: aggregate <22

GUARDRAILS:
- evidenceStrength <= 2 means action MUST be "Watch" or "Park" (not "Pitch" or "Act now").
- reputationRisk >= 4 means downgrade action by one class (Act now → Pitch, Pitch → Watch).
- Don't invent journalist interest or relationships.

Return JSON only.
`.trim();

async function scoreOne(payload: string) {
  const resp = await anthropic.messages.create({
    model: MODELS.reasoning,
    max_tokens: 600,
    system: cachedSystem(INSTRUCTIONS),
    messages: [{ role: "user", content: payload }],
  });
  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  const raw = block.text.replace(/```json|```/g, "").trim();
  try {
    const parsed = ScoreSchema.parse(JSON.parse(raw));
    const s = parsed.scores;
    // aggregate: positive axes minus risk
    const positive =
      s.timAuthorityFit +
      s.colCommercialUpside +
      s.microdramaRelevance +
      s.mediaCoveragePotential +
      s.relationshipValue +
      s.personalityFit +
      s.timeliness +
      s.evidenceStrength +
      s.easeOfAction;
    const fitScore = Math.max(0, Math.min(100, Math.round(((positive - s.reputationRisk) / 45) * 100)));
    return { ...parsed, fitScore };
  } catch {
    return null;
  }
}

export async function rerankAll() {
  const campaign = await getCampaignContext();

  // Awards.
  const awards = await store.getAwards();
  let awardsUpdated = 0;
  for (const a of awards) {
    if (!["identified", "drafted"].includes(a.status)) continue;
    const payload =
      (campaign ? `Campaign context:\n${campaign}\n\n` : "") +
      `Opportunity type: award\n` +
      `Name: ${a.name}\n` +
      (a.organizer ? `Organizer: ${a.organizer}\n` : "") +
      (a.category ? `Category: ${a.category}\n` : "") +
      (a.deadline ? `Deadline: ${a.deadline}\n` : "") +
      (a.feeUsd ? `Fee: $${a.feeUsd}\n` : "") +
      (a.notes ? `Notes: ${a.notes}\n` : "");
    const score = await scoreOne(payload);
    if (!score) continue;
    a.fitScore = score.fitScore;
    a.fitRationale = `[${score.action}] ${score.rationale}`;
    if (score.priority) a.priority = score.priority;
    awardsUpdated++;
  }
  if (awardsUpdated > 0) await store.setAwards(awards);

  // Speaking.
  const speaking = await store.getSpeaking();
  let speakingUpdated = 0;
  for (const s of speaking) {
    if (!["identified", "applied"].includes(s.status)) continue;
    const payload =
      (campaign ? `Campaign context:\n${campaign}\n\n` : "") +
      `Opportunity type: speaking\n` +
      `Name: ${s.name}\n` +
      (s.organizer ? `Organizer: ${s.organizer}\n` : "") +
      (s.location ? `Location: ${s.location}\n` : "") +
      (s.startsAt ? `Starts: ${s.startsAt}\n` : "") +
      (s.cfpDeadline ? `CFP deadline: ${s.cfpDeadline}\n` : "") +
      (s.role ? `Sought role: ${s.role}\n` : "");
    const score = await scoreOne(payload);
    if (!score) continue;
    s.fitScore = score.fitScore;
    s.fitRationale = `[${score.action}] ${score.rationale}`;
    speakingUpdated++;
  }
  if (speakingUpdated > 0) await store.setSpeaking(speaking);

  // Media.
  const media = await store.getMedia();
  let mediaUpdated = 0;
  for (const m of media) {
    if (!["identified", "pitched"].includes(m.status)) continue;
    const payload =
      (campaign ? `Campaign context:\n${campaign}\n\n` : "") +
      `Opportunity type: media\n` +
      `Outlet: ${m.outlet}\n` +
      (m.journalist ? `Journalist: ${m.journalist}\n` : "") +
      (m.beat ? `Beat: ${m.beat}\n` : "") +
      (m.pitchAngle ? `Working angle: ${m.pitchAngle}\n` : "") +
      `Tier: ${m.tier}\n`;
    const score = await scoreOne(payload);
    if (!score) continue;
    m.notes = `[${score.action}] ${score.rationale}\n\n${m.notes ?? ""}`.trim();
    mediaUpdated++;
  }
  if (mediaUpdated > 0) await store.setMedia(media);

  return {
    awards: { updated: awardsUpdated },
    speaking: { updated: speakingUpdated },
    media: { updated: mediaUpdated },
  };
}
