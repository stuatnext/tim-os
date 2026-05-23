/**
 * RSS feed sources to monitor for industry news.
 * Filtered against PRIORITY_KEYWORDS so we only ingest items relevant to Tim's beat.
 */
export const FEED_SOURCES = [
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
];

/**
 * Only ingest items whose title or snippet mentions one of these keywords.
 * Aggressive filtering — Variety publishes a lot.
 */
export const PRIORITY_KEYWORDS = [
  "micro-drama",
  "microdrama",
  "vertical drama",
  "vertical content",
  "vertical video",
  "short drama",
  "short-form drama",
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
  "Timothy Oh",
];
