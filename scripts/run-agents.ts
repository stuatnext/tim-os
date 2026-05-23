/**
 * Run every Tim OS agent end-to-end. Useful for cron-from-anywhere setups
 * (a single Cloud Scheduler job that hits one process) or for local testing.
 *
 *   npm run agents:run
 */
import { refreshFeeds } from "../src/lib/rss";
import { summariseBatch } from "../src/lib/agents/rss-summariser";
import { rerankAll } from "../src/lib/agents/opportunity-ranker";
import { generateWeeklyBrief } from "../src/lib/agents/brief";

async function main() {
  console.log("→ Refreshing RSS feeds...");
  const feeds = await refreshFeeds();
  console.log(`  ✓ scanned ${feeds.scanned}, inserted ${feeds.inserted}`);

  console.log("→ Summarising new items (Haiku)...");
  const summarised = await summariseBatch(30);
  console.log(`  ✓ processed ${summarised.processed}, updated ${summarised.updated}`);

  console.log("→ Re-ranking opportunities (Sonnet)...");
  const ranked = await rerankAll();
  console.log(
    `  ✓ awards ${ranked.awards.updated}, speaking ${ranked.speaking.updated}, media ${ranked.media.updated}`
  );

  console.log("→ Generating weekly brief (Opus)...");
  const brief = await generateWeeklyBrief();
  console.log(`  ✓ brief: ${brief.headline}`);

  console.log("✓ All agents done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
