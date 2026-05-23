/**
 * RSS feed sources to monitor for industry news.
 * Filtered against PRIORITY_KEYWORDS so we only ingest items relevant to Tim's beat.
 *
 * Two tiers:
 *   1. Direct trade-press feeds (Variety, Deadline, THR, etc). Most reliable
 *      content, but some hosts block scrapers — they need to be on the
 *      routine environment's network allowlist.
 *   2. Google News RSS search queries — more permissive, broader reach.
 *      These act as fallback / supplementary coverage when direct feeds are
 *      blocked, and let us track specific competitor + journalist names
 *      without depending on each outlet shipping an open RSS feed.
 *
 * If `npm run feeds` reports `networkPolicyBlocked: true`, the routine
 * environment's egress policy is blocking RSS hostnames — see
 * OPPORTUNITY_RADAR.md → "Environment network policy".
 */

const googleNews = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

export const FEED_SOURCES = [
  // ---------- direct trade-press feeds ----------
  { name: "Variety", url: "https://variety.com/feed/" },
  { name: "Variety — International", url: "https://variety.com/v/international/feed/" },
  { name: "Deadline", url: "https://deadline.com/feed/" },
  { name: "Deadline — International", url: "https://deadline.com/v/international/feed/" },
  { name: "The Hollywood Reporter", url: "https://www.hollywoodreporter.com/feed/" },
  { name: "Hollywood Reporter — Business", url: "https://www.hollywoodreporter.com/c/business/feed/" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { name: "TechCrunch — Apps", url: "https://techcrunch.com/category/apps/feed/" },
  { name: "Campaign Asia", url: "https://www.campaignasia.com/rss" },
  { name: "Bloomberg — Technology", url: "https://feeds.bloomberg.com/technology/news.rss" },
  { name: "Reuters — Tech & Media", url: "https://www.reutersagency.com/feed/?best-topics=technology" },
  { name: "Mashable — Entertainment", url: "http://feeds.mashable.com/Mashable" },
  { name: "ContentAsia", url: "https://www.contentasia.tv/feed" },
  { name: "TBI Vision", url: "https://tbivision.com/feed/" },
  { name: "C21Media", url: "https://www.c21media.net/feed/" },
  { name: "The Drum", url: "https://www.thedrum.com/rss.xml" },
  { name: "Mumbrella Asia", url: "https://www.mumbrella.asia/feed" },

  // ---------- Google News search fallbacks (more permissive, broader reach) ----------
  // Core category coverage
  { name: "Google News — microdrama", url: googleNews("microdrama OR \"micro-drama\" OR \"vertical drama\"") },
  { name: "Google News — vertical content", url: googleNews("\"vertical video\" OR \"vertical content\" OR \"vertical storytelling\"") },
  { name: "Google News — short-form drama", url: googleNews("\"short-form drama\" OR \"short drama\"") },

  // COL Group + properties
  { name: "Google News — COL Group", url: googleNews("\"COL Group\" OR ReelShort OR FlareFlow") },
  { name: "Google News — Timothy Oh", url: googleNews("\"Timothy Oh\" OR \"Tim Oh\" \"vertical\"") },

  // Competitors
  { name: "Google News — competitors", url: googleNews("DramaBox OR ShortMax OR GoodShort OR PineDrama OR \"Crazy Maple\"") },

  // Brand + advertiser entry signals
  { name: "Google News — brand vertical drama", url: googleNews("\"branded microdrama\" OR \"branded vertical\" OR \"vertical drama advertiser\"") },

  // AI in vertical production
  { name: "Google News — AI vertical production", url: googleNews("Sora OR Veo OR Runway OR Kling \"vertical\" OR microdrama") },

  // Streamer / platform signals
  { name: "Google News — streamer shorts", url: googleNews("(Netflix OR TikTok OR YouTube OR Disney) (\"short-form\" OR vertical OR mini-drama)") },
];

/**
 * Only ingest items whose title or snippet mentions one of these keywords.
 * Aggressive filtering — the broader sources (Google News + Variety) publish a lot.
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
