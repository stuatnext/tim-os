/**
 * RSS SUMMARISER AGENT (Haiku 4.5)
 *
 * For each newly-ingested IndustryItem, produces:
 *  - aiSummary    (60-100 words)
 *  - topics       (JSON array)
 *  - relevanceScore (0-100, vs Tim's positioning)
 *  - hook         (one-line angle Tim could react to)
 *
 * Cheap and fast — runs as a background sweep every ~hour.
 */
import { z } from "zod";
import { prisma } from "../prisma";
import { anthropic, MODELS } from "../anthropic";
import { cachedSystem } from "../context";

const ResultSchema = z.object({
  summary: z.string(),
  topics: z.array(z.string()),
  relevanceScore: z.number().min(0).max(100),
  hook: z.string(),
});

const INSTRUCTIONS = `
You are the RSS triage agent for Tim OS.

For each industry news item, produce strict JSON:
{
  "summary": "60-100 word neutral summary",
  "topics": ["tag1", "tag2", ...],
  "relevanceScore": 0-100 (how relevant to Tim's positioning),
  "hook": "ONE sentence — what's the angle Tim could react to on LinkedIn?"
}

Relevance scoring rubric:
- 90-100: directly about COL, FlareFlow, ReelShort, micro-drama, vertical drama, or Tim himself.
- 70-89: competitor (DramaBox, ShortMax, PineDrama), brand-microdrama deals, Disney/Netflix entering vertical.
- 50-69: vertical content broadly, mobile-first storytelling, attention economy, F2P-style entertainment monetisation.
- 30-49: adjacent (TikTok strategy, streaming wars, China content exports, creator economy).
- 0-29: not Tim's beat.

Hook rules:
- Specific, not generic. ("DramaBox raised $50M — Tim's angle: distribution beats content" not "react to fundraise").
- Anchor on Tim's existing thesis (Vertical 2.0, behavioural shift, infrastructure-over-content).
- Skip cliches and corporate-speak.

Return ONLY the JSON object. No prose around it.
`.trim();

export async function summariseItem(itemId: string) {
  const item = await prisma.industryItem.findUnique({ where: { id: itemId } });
  if (!item) return null;
  if (item.aiSummary) return item; // already done

  const userText = [
    `Source: ${item.source}`,
    `Title: ${item.title}`,
    `URL: ${item.url}`,
    `Published: ${item.publishedAt?.toISOString() ?? "unknown"}`,
    "",
    item.rawSummary ?? "(no snippet available)",
  ].join("\n");

  const resp = await anthropic.messages.create({
    model: MODELS.ingestion,
    max_tokens: 600,
    system: cachedSystem(INSTRUCTIONS),
    messages: [{ role: "user", content: userText }],
  });

  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  // Tolerate code-fenced JSON.
  const raw = textBlock.text.replace(/```json|```/g, "").trim();
  let parsed;
  try {
    parsed = ResultSchema.parse(JSON.parse(raw));
  } catch {
    // Salvage: mark as reviewed but un-enriched.
    await prisma.industryItem.update({
      where: { id: itemId },
      data: { status: "reviewed", aiSummary: "(parser failed)" },
    });
    return null;
  }

  return prisma.industryItem.update({
    where: { id: itemId },
    data: {
      aiSummary: parsed.summary,
      topics: JSON.stringify(parsed.topics),
      relevanceScore: parsed.relevanceScore,
      hook: parsed.hook,
      status: "reviewed",
    },
  });
}

export async function summariseBatch(limit = 20) {
  const items = await prisma.industryItem.findMany({
    where: { status: "new", aiSummary: null },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  let updated = 0;
  const errors: string[] = [];
  for (const item of items) {
    try {
      const result = await summariseItem(item.id);
      if (result) updated++;
    } catch (e) {
      errors.push(`${item.id}: ${e}`);
    }
  }

  return { processed: items.length, updated, errors };
}
