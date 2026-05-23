/**
 * RSS ingestion. Polls the curated feed list, deduplicates against URL,
 * and persists raw items. The summariser agent then enriches them.
 */
import Parser from "rss-parser";
import { prisma } from "./prisma";
import { FEED_SOURCES, PRIORITY_KEYWORDS } from "./data/feed-sources";

const parser: Parser = new Parser({ timeout: 10_000 });

function matchesPriority(text: string): boolean {
  const lower = text.toLowerCase();
  return PRIORITY_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

export async function refreshFeeds() {
  let inserted = 0;
  let scanned = 0;
  const errors: string[] = [];

  for (const source of FEED_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items ?? []) {
        scanned++;
        if (!item.link || !item.title) continue;

        // Aggressive keyword filter — trade outlets publish a lot.
        const blob = `${item.title} ${item.contentSnippet ?? ""} ${item.content ?? ""}`;
        if (!matchesPriority(blob)) continue;

        try {
          await prisma.industryItem.create({
            data: {
              source: source.name,
              sourceUrl: source.url,
              title: item.title,
              url: item.link,
              publishedAt: item.isoDate ? new Date(item.isoDate) : null,
              rawSummary: (item.contentSnippet ?? "").slice(0, 1000),
              status: "new",
            },
          });
          inserted++;
        } catch (e) {
          if (!String(e).includes("Unique constraint")) {
            errors.push(`${source.name} / ${item.link}: ${e}`);
          }
        }
      }
    } catch (e) {
      errors.push(`${source.name}: ${e}`);
    }
  }

  return { sources: FEED_SOURCES.length, scanned, inserted, errors };
}
