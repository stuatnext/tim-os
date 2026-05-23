/**
 * RSS feed sources to monitor for industry news.
 *
 * This is the *RSS-pollable subset* of Tim's full source map. The comprehensive
 * list lives in knowledge/OPPORTUNITY_RADAR.md — many of those sources are
 * paywalled, social-only, or have no usable RSS, so the routine fetches them
 * via web search during the in-session run instead.
 *
 * Curation rule: a URL belongs here ONLY if it reliably returns RSS to a
 * normal client. Known-dead RSS URLs (Bloomberg public RSS deprecated 2019,
 * Reuters Agency feed retired, Mashable FeedBurner long-defunct) are NOT in
 * this list — they're documented in OPPORTUNITY_RADAR.md as "fetch via web
 * search instead". If a source 403s every run, write it out: remove the
 * entry from this file and add a "fetch via web search" line in the radar.
 *
 * Items are filtered against PRIORITY_KEYWORDS so we only ingest items
 * relevant to Tim's beat.
 *
 * If `npm run feeds` reports `networkPolicyBlocked: true`, the routine
 * environment's egress policy is blocking RSS hostnames — that's an
 * environment fix, not a code fix. See OPPORTUNITY_RADAR.md →
 * "Environment network policy".
 */

const googleNews = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

export const FEED_SOURCES = [
  // ---------- direct trade-press RSS (publishers that still ship open feeds) ----------
  { name: "Variety", url: "https://variety.com/feed/" },
  { name: "Variety — International", url: "https://variety.com/v/international/feed/" },
  { name: "Deadline", url: "https://deadline.com/feed/" },
  { name: "The Hollywood Reporter", url: "https://www.hollywoodreporter.com/feed/" },
  { name: "Hollywood Reporter — Business", url: "https://www.hollywoodreporter.com/c/business/feed/" },
  { name: "Campaign Asia", url: "https://www.campaignasia.com/rss" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { name: "TechCrunch — Apps", url: "https://techcrunch.com/category/apps/feed/" },
  { name: "ContentAsia", url: "https://www.contentasia.tv/feed" },
  { name: "TBI Vision", url: "https://tbivision.com/feed/" },
  { name: "C21Media", url: "https://www.c21media.net/feed/" },
  { name: "The Drum", url: "https://www.thedrum.com/rss.xml" },
  { name: "Mumbrella Asia", url: "https://www.mumbrella.asia/feed" },

  // ---------- Google News search-RSS fallbacks (broad, permissive, reliable) ----------
  { name: "Google News — microdrama", url: googleNews("microdrama OR \"micro-drama\" OR \"vertical drama\"") },
  { name: "Google News — vertical content", url: googleNews("\"vertical video\" OR \"vertical content\" OR \"vertical storytelling\"") },
  { name: "Google News — short-form drama", url: googleNews("\"short-form drama\" OR \"short drama\"") },
  { name: "Google News — COL Group", url: googleNews("\"COL Group\" OR ReelShort OR FlareFlow") },
  { name: "Google News — Timothy Oh", url: googleNews("\"Timothy Oh\" OR \"Tim Oh\" \"vertical\"") },
  { name: "Google News — competitors", url: googleNews("DramaBox OR ShortMax OR GoodShort OR PineDrama OR \"Crazy Maple\"") },
  { name: "Google News — brand vertical drama", url: googleNews("\"branded microdrama\" OR \"branded vertical\" OR \"vertical drama advertiser\"") },
  { name: "Google News — AI vertical production", url: googleNews("Sora OR Veo OR Runway OR Kling \"vertical\" OR microdrama") },
  { name: "Google News — streamer shorts", url: googleNews("(Netflix OR TikTok OR YouTube OR Disney) (\"short-form\" OR vertical OR mini-drama)") },
];

/**
 * Only ingest items whose title or snippet mentions one of these keywords.
 * Aggressive filtering — the broader sources publish a lot of irrelevant noise.
 */
export const PRIORITY_KEYWORDS = [
  "micro-drama",
  "microdrama",
  "vertical drama",
  "vertical content",
  "vertical video",
  "vertical storytelling",
  "short drama",
  "short-form drama",
  "short-form video",
  "ReelShort",
  "FlareFlow",
  "COL Group",
  "DramaBox",
  "Crazy Maple",
  "ShortMax",
  "PineDrama",
  "GoodShort",
  "ByteDance drama",
  "mobile-first content",
  "vertical streaming",
  "branded content micro",
  "branded microdrama",
  "Timothy Oh",
  "Tim Oh",
];
