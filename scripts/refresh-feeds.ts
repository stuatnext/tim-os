/**
 * Refresh only — pulls the RSS feeds without running any AI agents.
 * Cheap to schedule frequently (every 30 min). Summariser then runs less often.
 *
 *   npm run feeds:refresh
 */
import { refreshFeeds } from "../src/lib/rss";

async function main() {
  const r = await refreshFeeds();
  console.log(`Sources scanned: ${r.sources}`);
  console.log(`Items scanned: ${r.scanned}`);
  console.log(`Items inserted: ${r.inserted}`);
  if (r.errors.length) {
    console.log(`Errors (${r.errors.length}):`);
    for (const e of r.errors.slice(0, 5)) console.log(`  - ${e}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
