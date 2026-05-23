/**
 * Full Tim OS pipeline — the entry point the Claude Code routine calls.
 *
 *   npm run pipeline
 *
 * Sequence:
 *   1. Refresh RSS feeds (no AI)
 *   2. Summarise new items (Haiku)
 *   3. Re-rank opportunities (Sonnet)
 *   4. Generate 3 fresh content drafts (Sonnet)
 *   5. Generate the weekly brief (Opus) — only if it's Sunday/Monday
 *   6. Re-render docs/index.html
 *
 * Logs each step to data/state/runs.json for audit.
 */
import { refreshFeeds } from "../src/agents/refresh-feeds";
import { summariseBatch } from "../src/agents/summarise";
import { rerankAll } from "../src/agents/rank-opportunities";
import { generateDrafts } from "../src/agents/generate-content";
import { generateWeeklyBrief } from "../src/agents/brief";
import { renderDashboard } from "../src/render";
import { store, cuid, nowIso, type AgentRun } from "../src/lib/store";

async function track<T>(
  agent: string,
  fn: () => Promise<T>,
  extract: (result: T) => { created?: number; updated?: number } = () => ({})
): Promise<T | null> {
  const startedAt = nowIso();
  console.log(`→ ${agent}...`);
  try {
    const result = await fn();
    const stats = extract(result);
    const run: AgentRun = {
      id: cuid(),
      agent,
      status: "success",
      startedAt,
      finishedAt: nowIso(),
      itemsCreated: stats.created ?? 0,
      itemsUpdated: stats.updated ?? 0,
    };
    await store.appendRun(run);
    console.log(`  ✓ ${agent} — ${run.itemsCreated} new, ${run.itemsUpdated} updated`);
    return result;
  } catch (e) {
    const run: AgentRun = {
      id: cuid(),
      agent,
      status: "failure",
      startedAt,
      finishedAt: nowIso(),
      itemsCreated: 0,
      itemsUpdated: 0,
      errorMessage: String(e).slice(0, 2000),
    };
    await store.appendRun(run);
    console.error(`  ✗ ${agent} failed: ${e}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const skipBrief = args.includes("--no-brief");
  const forceBrief = args.includes("--brief");

  await track("refresh-feeds", refreshFeeds, (r) => ({ created: r.inserted }));
  await track("summarise", () => summariseBatch(30), (r) => ({ updated: r.updated }));
  await track("rank-opportunities", rerankAll, (r) => ({
    updated: r.awards.updated + r.speaking.updated + r.media.updated,
  }));
  await track("generate-content", () => generateDrafts(), (r) => ({ created: r.drafts.length }));

  const day = new Date().getUTCDay(); // 0 = Sun, 1 = Mon
  const briefDay = day === 0 || day === 1;
  if (!skipBrief && (forceBrief || briefDay)) {
    await track("weekly-brief", generateWeeklyBrief, () => ({ created: 1 }));
  } else {
    console.log("→ skipping weekly-brief (only runs Sun/Mon; pass --brief to force)");
  }

  console.log("→ rendering docs/index.html...");
  const { bytes } = await renderDashboard();
  console.log(`  ✓ ${(bytes / 1024).toFixed(1)} kB`);

  console.log("✓ pipeline complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
