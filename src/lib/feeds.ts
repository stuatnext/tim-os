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

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15";

const parser: Parser = new Parser({
  timeout: 15_000,
  headers: {
    "User-Agent": BROWSER_UA,
    Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7",
  },
});

function matchesPriority(text: string): boolean {
  const lower = text.toLowerCase();
  return PRIORITY_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

function classifyError(err: unknown): { kind: "denied" | "timeout" | "upstream"; msg: string } {
  const raw = String(err);
  if (/host_not_allowed|EAI_AGAIN|ENOTFOUND|EHOSTUNREACH|ECONNREFUSED|403|denied/i.test(raw)) {
    return { kind: "denied", msg: raw };
  }
  if (/timeout|ETIMEDOUT|ESOCKETTIMEDOUT/i.test(raw)) {
    return { kind: "timeout", msg: raw };
  }
  return { kind: "upstream", msg: raw };
}

export async function refreshFeeds() {
  const existing = await store.getIntelligence();
  const existingUrls = new Set(existing.map((x) => x.url));

  let inserted = 0;
  let scanned = 0;
  const errors: string[] = [];
  const denied: string[] = [];
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
      const c = classifyError(e);
      const line = `${source.name} [${c.kind}]: ${c.msg}`;
      if (c.kind === "denied") denied.push(line);
      else errors.push(line);
    }
  }

  if (newItems.length > 0) {
    await store.setIntelligence([...newItems, ...existing]);
  }

  // Flag the policy-blocked case: zero items got through AND a majority of
  // sources reported denial. Lets the routine distinguish "the firewall is
  // closed" from "today's feeds were thin".
  const policyBlocked =
    inserted === 0 && denied.length >= Math.ceil(FEED_SOURCES.length / 2);

  return {
    sources: FEED_SOURCES.length,
    scanned,
    inserted,
    errors,
    denied,
    networkPolicyBlocked: policyBlocked,
    notes: policyBlocked
      ? `${denied.length} of ${FEED_SOURCES.length} sources returned host_not_allowed / connection denied. The routine's environment network policy needs the RSS hostnames on its allowlist. See knowledge/OPPORTUNITY_RADAR.md → 'Environment network policy'.`
      : undefined,
  };
}
