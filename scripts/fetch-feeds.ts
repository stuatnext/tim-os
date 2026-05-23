/**
 * Pull curated RSS sources into data/state/intelligence.json.
 *
 *   npm run feeds
 *
 * Pure I/O, no LLM. The routine (Claude Code) reads the new items afterwards
 * and does all summarisation / scoring / classification in-session.
 */
import { refreshFeeds } from "../src/lib/feeds";

async function main() {
  const result = await refreshFeeds();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) {
    console.warn(`(${result.errors.length} source error${result.errors.length === 1 ? "" : "s"} — see above)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
