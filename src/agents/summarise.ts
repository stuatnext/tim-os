/**
 * RSS SUMMARISER AGENT (Haiku 4.5)
 *
 * For each new IndustryItem, asks Haiku for a tight triage assessment:
 *  - 60-100 word neutral summary (no spin)
 *  - topic tags
 *  - 0-100 relevance score against Tim's positioning
 *  - one-line angle, with the suggested ACTION class
 *
 * Operates under the full strategic objective in the system prompt.
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
You are the RSS triage agent for Tim OS. You work under the STRATEGIC OBJECTIVE in
the system prompt — re-read it. You are looking for signals across the full
opportunity-types list (media, podcast, panel, awards, comment, DM, competitor, etc.),
not just "news to react to".

For each item, produce strict JSON:
{
  "summary": "60-100 word NEUTRAL summary. Just facts. No spin. No corporate gloss.",
  "topics": ["tag1", "tag2", ...],
  "relevanceScore": 0-100 (see rubric),
  "hook": "ONE sentence. Either (a) the angle Tim could take, OR (b) the suggested ACTION ('Comment on this', 'Pitch this journalist', 'Watch — not actionable yet', etc.)"
}

RELEVANCE RUBRIC:
- 90-100: directly about COL, FlareFlow, ReelShort, micro-drama, vertical drama, or Tim.
- 70-89: competitor (DramaBox, ShortMax, PineDrama), brand-microdrama deals, major studio/streamer entering vertical, Asia-to-West content flow.
- 50-69: vertical content broadly, mobile-first storytelling, attention economy, F2P entertainment monetisation, named journalist Tim could be a source for.
- 30-49: adjacent (TikTok strategy, streaming wars, China content exports, creator economy, Singapore tech stories).
- 0-29: not Tim's beat. Be ruthless — most general entertainment news is noise.

HOOK RULES:
- Specific, not generic. ("DramaBox raised $50M — comment with distribution-beats-content angle" not "react to fundraise".)
- Anchor on Tim's actual theses (Vertical 2.0, behavioural shift, infrastructure-over-content, distribution beats content).
- If the item's an opportunity to engage publicly with another person, name them and the move.
- Skip cliches and corporate-speak.

GUARDRAILS:
- Never invent quotes. Just report what's in the snippet.
- Mark relevanceScore <= 30 if the evidence is weak or the connection to Tim is thin.

Return ONLY the JSON object.
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
