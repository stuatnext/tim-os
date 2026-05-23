/**
 * RSS feed refresh — pure ingestion, no LLM.
 *
 * Polls curated industry feeds, keyword-filters to Tim's beat, deduplicates
 * against existing items, and appends new ones to intelligence.json with
 * status="new". The routine (Claude Code) then reads those new items and
 * scores / hooks / classifies them in-session.
 */
import Parser from "rss-parser";
import { FEED_SOURCES, PRIORITY_KEYWORDS } from "./data/feed-sources";
import { store, cuid, nowIso, type IndustryItem } from "./store";

const parser: Parser = new Parser({ timeout: 10_000 });

function matchesPriority(text: string): boolean {
  const lower = text.toLowerCase();
  return PRIORITY_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

export async function refreshFeeds() {
  const existing = await store.getIntelligence();
  const existingUrls = new Set(existing.map((x) => x.url));

  let inserted = 0;
  let scanned = 0;
  const errors: string[] = [];
  const newItems: IndustryItem[] = [];

  for (const source of FEED_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items ?? []) {
        scanned++;
        if (!item.link || !item.title) continue;
        if (existingUrls.has(item.link)) continue;

        const blob = `${item.title} ${item.contentSnippet ?? ""} ${item.content ?? ""}`;
        if (!matchesPriority(blob)) continue;

        newItems.push({
          id: cuid(),
          source: source.name,
          sourceUrl: source.url,
          title: item.title,
          url: item.link,
          publishedAt: item.isoDate,
          rawSummary: (item.contentSnippet ?? "").slice(0, 1000),
          status: "new",
          createdAt: nowIso(),
        });
        existingUrls.add(item.link);
        inserted++;
      }
    } catch (e) {
      errors.push(`${source.name}: ${e}`);
    }
  }

  if (newItems.length > 0) {
    await store.setIntelligence([...newItems, ...existing]);
  }

  return { sources: FEED_SOURCES.length, scanned, inserted, errors };
}
