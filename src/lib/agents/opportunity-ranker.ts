/**
 * OPPORTUNITY RANKER AGENT (Sonnet 4.6)
 *
 * Re-scores awards, speaking events, and media targets against Tim's current
 * campaign goals. Sets fitScore + fitRationale so the dashboard can surface
 * the right next action.
 */
import { z } from "zod";
import { prisma } from "../prisma";
import { anthropic, MODELS } from "../anthropic";
import { cachedSystem, getCampaignContext } from "../context";

const ScoreSchema = z.object({
  fitScore: z.number().min(0).max(100),
  fitRationale: z.string(),
  priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
});

const INSTRUCTIONS = `
You re-score opportunities (awards, speaking events, media targets) for Tim's campaign.

For each opportunity, return strict JSON:
{
  "fitScore": 0-100,
  "fitRationale": "1-2 sentences: why this matters for Tim right now",
  "priority": "urgent" | "high" | "medium" | "low"   // optional
}

Scoring rubric:
- 90-100: clear category match, deadline imminent, would obviously move Tim's needle.
- 75-89: strong fit, worth investing time.
- 50-74: relevant but lower ROI.
- 0-49: skip.

Priority rubric:
- urgent: deadline <14 days AND fitScore >= 75.
- high: fitScore >= 80, or strategic narrative carrier.
- medium: fitScore 60-79.
- low: fitScore < 60.

Return JSON only.
`.trim();

type OppType = "award" | "speaking" | "media";

async function scoreOne(type: OppType, payload: string) {
  const campaign = await getCampaignContext();
  const userText = [
    campaign ? `Campaign context:\n${campaign}\n` : "",
    `Opportunity type: ${type}`,
    "",
    payload,
  ].join("\n");

  const resp = await anthropic.messages.create({
    model: MODELS.reasoning,
    max_tokens: 400,
    system: cachedSystem(INSTRUCTIONS),
    messages: [{ role: "user", content: userText }],
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

export async function rerankAwards(limit = 25) {
  const awards = await prisma.award.findMany({
    where: { status: { in: ["identified", "drafted"] } },
    take: limit,
  });

  let updated = 0;
  for (const a of awards) {
    const payload = [
      `Name: ${a.name}`,
      a.organizer ? `Organizer: ${a.organizer}` : "",
      a.category ? `Category: ${a.category}` : "",
      a.deadline ? `Deadline: ${a.deadline.toISOString().slice(0, 10)}` : "",
      a.ceremonyAt ? `Ceremony: ${a.ceremonyAt.toISOString().slice(0, 10)}` : "",
      a.feeUsd ? `Fee: $${a.feeUsd}` : "",
      a.notes ? `Notes: ${a.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const score = await scoreOne("award", payload);
    if (!score) continue;
    await prisma.award.update({
      where: { id: a.id },
      data: {
        fitScore: score.fitScore,
        fitRationale: score.fitRationale,
        ...(score.priority ? { priority: score.priority } : {}),
      },
    });
    updated++;
  }
  return { processed: awards.length, updated };
}

export async function rerankSpeaking(limit = 25) {
  const events = await prisma.speakingEvent.findMany({
    where: { status: { in: ["identified", "applied"] } },
    take: limit,
  });

  let updated = 0;
  for (const e of events) {
    const payload = [
      `Name: ${e.name}`,
      e.organizer ? `Organizer: ${e.organizer}` : "",
      e.location ? `Location: ${e.location}` : "",
      e.startsAt ? `Starts: ${e.startsAt.toISOString().slice(0, 10)}` : "",
      e.cfpDeadline ? `CFP deadline: ${e.cfpDeadline.toISOString().slice(0, 10)}` : "",
      e.role ? `Sought role: ${e.role}` : "",
      e.notes ? `Notes: ${e.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const score = await scoreOne("speaking", payload);
    if (!score) continue;
    await prisma.speakingEvent.update({
      where: { id: e.id },
      data: { fitScore: score.fitScore, fitRationale: score.fitRationale },
    });
    updated++;
  }
  return { processed: events.length, updated };
}

export async function rerankMedia(limit = 25) {
  const targets = await prisma.mediaTarget.findMany({
    where: { status: { in: ["identified", "pitched"] } },
    take: limit,
  });

  let updated = 0;
  for (const m of targets) {
    const payload = [
      `Outlet: ${m.outlet}`,
      m.journalist ? `Journalist: ${m.journalist}` : "",
      m.beat ? `Beat: ${m.beat}` : "",
      m.pitchAngle ? `Working angle: ${m.pitchAngle}` : "",
      `Tier: ${m.tier}`,
      m.status ? `Status: ${m.status}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const score = await scoreOne("media", payload);
    if (!score) continue;
    await prisma.mediaTarget.update({
      where: { id: m.id },
      data: { notes: `${m.notes ?? ""}\n\nAI rationale: ${score.fitRationale}`.trim() },
    });
    updated++;
  }
  return { processed: targets.length, updated };
}

export async function rerankAll() {
  const awards = await rerankAwards();
  const speaking = await rerankSpeaking();
  const media = await rerankMedia();
  return { awards, speaking, media };
}
