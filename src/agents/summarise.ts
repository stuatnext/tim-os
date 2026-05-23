/**
 * RSS SUMMARISER AGENT (Haiku 4.5)
 *
 * For each new IndustryItem, asks Haiku for:
 *  - 60-100 word summary
 *  - topic tags
 *  - 0-100 relevance score against Tim's positioning
 *  - one-line LinkedIn angle Tim could react to
 */
import { z } from "zod";
import { anthropic, MODELS } from "../lib/anthropic";
import { cachedSystem } from "../lib/context";
import { store } from "../lib/store";

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
  "relevanceScore": 0-100,
  "hook": "ONE sentence — what's the angle Tim could react to on LinkedIn?"
}

Relevance scoring rubric:
- 90-100: directly about COL, FlareFlow, ReelShort, micro-drama, vertical drama, or Tim.
- 70-89: competitor (DramaBox, ShortMax, PineDrama), brand-microdrama deals, Disney/Netflix entering vertical.
- 50-69: vertical content broadly, mobile-first storytelling, attention economy.
- 30-49: adjacent (TikTok strategy, streaming wars, China content exports, creator economy).
- 0-29: not Tim's beat.

Hook rules:
- Specific, not generic.
- Anchor on Tim's existing thesis (Vertical 2.0, behavioural shift, infrastructure-over-content).
- Skip cliches and corporate-speak.

Return ONLY the JSON object. No prose around it.
`.trim();

export async function summariseBatch(limit = 20) {
  const all = await store.getIntelligence();
  const targets = all.filter((x) => x.status === "new" && !x.aiSummary).slice(0, limit);

  let updated = 0;
  const errors: string[] = [];

  for (const item of targets) {
    const userText = [
      `Source: ${item.source}`,
      `Title: ${item.title}`,
      `URL: ${item.url}`,
      `Published: ${item.publishedAt ?? "unknown"}`,
      "",
      item.rawSummary ?? "(no snippet available)",
    ].join("\n");

    try {
      const resp = await anthropic.messages.create({
        model: MODELS.ingestion,
        max_tokens: 600,
        system: cachedSystem(INSTRUCTIONS),
        messages: [{ role: "user", content: userText }],
      });

      const block = resp.content.find((b) => b.type === "text");
      if (!block || block.type !== "text") continue;
      const raw = block.text.replace(/```json|```/g, "").trim();
      const parsed = ResultSchema.parse(JSON.parse(raw));

      item.aiSummary = parsed.summary;
      item.topics = parsed.topics;
      item.relevanceScore = parsed.relevanceScore;
      item.hook = parsed.hook;
      item.status = "reviewed";
      updated++;
    } catch (e) {
      errors.push(`${item.id}: ${e}`);
    }
  }

  if (updated > 0) await store.setIntelligence(all);
  return { processed: targets.length, updated, errors };
}
