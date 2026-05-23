/**
 * OPPORTUNITY RANKER (Sonnet 4.6)
 *
 * Re-scores awards, speaking events, and media targets against Tim's current
 * campaign goals. Sets fitScore + fitRationale.
 */
import { z } from "zod";
import { anthropic, MODELS } from "../lib/anthropic";
import { cachedSystem, getCampaignContext } from "../lib/context";
import { store } from "../lib/store";

const ScoreSchema = z.object({
  fitScore: z.number().min(0).max(100),
  fitRationale: z.string(),
  priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
});

const INSTRUCTIONS = `
Re-score opportunities (awards, speaking events, media targets) for Tim's campaign.

Return strict JSON:
{
  "fitScore": 0-100,
  "fitRationale": "1-2 sentences: why this matters for Tim right now",
  "priority": "urgent" | "high" | "medium" | "low"   // optional
}

Scoring rubric:
- 90-100: clear category match, deadline imminent, obvious needle-mover.
- 75-89: strong fit, worth investing time.
- 50-74: relevant but lower ROI.
- 0-49: skip.

Priority:
- urgent: deadline <14 days AND fitScore >= 75.
- high: fitScore >= 80, or strategic narrative carrier.
- medium: fitScore 60-79.
- low: fitScore < 60.

Return JSON only.
`.trim();

async function scoreOne(payload: string) {
  const resp = await anthropic.messages.create({
    model: MODELS.reasoning,
    max_tokens: 400,
    system: cachedSystem(INSTRUCTIONS),
    messages: [{ role: "user", content: payload }],
  });
  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  const raw = block.text.replace(/```json|```/g, "").trim();
  try {
    return ScoreSchema.parse(JSON.parse(raw));
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
    a.fitRationale = score.fitRationale;
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
    s.fitRationale = score.fitRationale;
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
    m.notes = `${m.notes ?? ""}\n\nAI rationale: ${score.fitRationale}`.trim();
    mediaUpdated++;
  }
  if (mediaUpdated > 0) await store.setMedia(media);

  return {
    awards: { updated: awardsUpdated },
    speaking: { updated: speakingUpdated },
    media: { updated: mediaUpdated },
  };
}
