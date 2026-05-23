/**
 * Per-agent CLI dispatcher. Used by the Claude Code routine if it wants to
 * run individual stages rather than the whole pipeline.
 *
 *   npm run agent:feeds       # refresh-feeds
 *   npm run agent:summarise   # haiku summariser
 *   npm run agent:rank        # opportunity ranker
 *   npm run agent:content     # generate 3 LinkedIn drafts
 *   npm run agent:brief       # weekly brief (force run, ignores day-of-week)
 */
import { refreshFeeds } from "../src/agents/refresh-feeds";
import { summariseBatch } from "../src/agents/summarise";
import { rerankAll } from "../src/agents/rank-opportunities";
import { generateDrafts } from "../src/agents/generate-content";
import { generateWeeklyBrief } from "../src/agents/brief";
import { renderDashboard } from "../src/render";

async function main() {
  const which = process.argv[2];
  if (!which) {
    console.error("Usage: tsx scripts/agents.ts <feeds|summarise|rank|content|brief>");
    process.exit(1);
  }

  switch (which) {
    case "feeds":
      console.log(JSON.stringify(await refreshFeeds(), null, 2));
      break;
    case "summarise":
      console.log(JSON.stringify(await summariseBatch(30), null, 2));
      break;
    case "rank":
      console.log(JSON.stringify(await rerankAll(), null, 2));
      break;
    case "content":
      console.log(JSON.stringify(await generateDrafts(), null, 2));
      break;
    case "brief":
      console.log(JSON.stringify(await generateWeeklyBrief(), null, 2));
      break;
    default:
      console.error(`Unknown agent: ${which}`);
      process.exit(1);
  }

  await renderDashboard();
  console.log("→ docs/index.html refreshed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
