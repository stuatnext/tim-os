/**
 * Full Tim OS pipeline — the entry point the Claude Code routine calls.
 *
 *   npm run pipeline                  # full run (auto-includes brief on Sun/Mon)
 *   npm run pipeline -- --no-brief    # skip Opus (cheaper mid-week run)
 *   npm run pipeline -- --brief       # force brief regen mid-week
 *
 * Sequence:
 *   1. Refresh RSS feeds (no AI)
 *   2. Summarise new items (Haiku)
 *   3. Re-rank opportunities (Sonnet)
 *   4. Generate 3 fresh content drafts (Sonnet)
 *   5. Generate the weekly brief (Opus) — Sun/Mon only by default
 *   6. Run quality check on the brief
 *   7. Re-render docs/index.html + root index.html
 *
 * Every stage is logged to data/state/runs.json with status
 * success | failure | low-value (and lowValueReason).
 */
import { refreshFeeds } from "../src/agents/refresh-feeds";
import { summariseBatch } from "../src/agents/summarise";
import { rerankAll } from "../src/agents/rank-opportunities";
import { generateDrafts } from "../src/agents/generate-content";
import { generateWeeklyBrief } from "../src/agents/brief";
import { renderDashboard } from "../src/render";
import { store, cuid, nowIso, type AgentRun, type Brief } from "../src/lib/store";

async function track<T>(
  agent: string,
  fn: () => Promise<T>,
  extract: (result: T) => { created?: number; updated?: number; lowValueReason?: string } = () => ({})
): Promise<T | null> {
  const startedAt = nowIso();
  console.log(`→ ${agent}...`);
  try {
    const result = await fn();
    const stats = extract(result);
    const run: AgentRun = {
      id: cuid(),
      agent,
      status: stats.lowValueReason ? "low-value" : "success",
      startedAt,
      finishedAt: nowIso(),
      itemsCreated: stats.created ?? 0,
      itemsUpdated: stats.updated ?? 0,
      lowValueReason: stats.lowValueReason,
    };
    await store.appendRun(run);
    console.log(
      `  ${run.status === "low-value" ? "⚠" : "✓"} ${agent} — ${run.itemsCreated} new, ${run.itemsUpdated} updated` +
        (stats.lowValueReason ? ` (LOW-VALUE: ${stats.lowValueReason})` : "")
    );
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

/**
 * Run quality check on the generated brief. Returns a lowValueReason if any
 * of the 7 checks fail, or undefined if the brief is good.
 */
function checkBriefQuality(brief: Brief): string | undefined {
  const reasons: string[] = [];

  // 1. At least one practical opportunity.
  const practical = brief.topOpportunities.filter(
    (o) => o.action !== "Ignore" && o.action !== "Park" && o.action !== "Watch"
  );
  if (practical.length === 0) reasons.push("no practical opportunities (all Watch/Park/Ignore)");

  // 2. Identified who to build relationship with.
  if (!brief.topPeople || brief.topPeople.length === 0) reasons.push("no relationship targets");

  // 3. At least one content angle.
  if (!brief.bestLinkedInAngle?.hook?.trim()) reasons.push("no LinkedIn angle");

  // 4. Avoid generic commentary — heuristic flag.
  const bad = /(thrilled|excited|honored|leverage|synergies|game-changer|visionary leader)/i;
  const allText = JSON.stringify({
    headline: brief.headline,
    whatChanged: brief.whatChanged,
    bestLinkedInAngle: brief.bestLinkedInAngle,
    bestMediaAngle: brief.bestMediaAngle,
  });
  if (bad.test(allText)) reasons.push("generic / corporate language detected");

  // 5. Source links for market claims — at least one opp with a source.
  const sourced = brief.topOpportunities.filter((o) => o.source);
  if (sourced.length === 0) reasons.push("no source links for opportunities");

  // 6. Confidential / invented claims — heuristic: weak evidence with strong action.
  const overclaimed = brief.topOpportunities.filter(
    (o) => o.evidence === "weak" && (o.action === "Act now" || o.action === "Pitch")
  );
  if (overclaimed.length > 0) reasons.push("weak-evidence opportunities classified Act now/Pitch");

  // 7. What changed since last run.
  if (!brief.whatChanged?.trim() || brief.whatChanged.length < 40) reasons.push("no 'what changed' section");

  return reasons.length ? reasons.join("; ") : undefined;
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
    await track("weekly-brief", generateWeeklyBrief, (brief) => {
      const lowValueReason = checkBriefQuality(brief);
      return { created: 1, lowValueReason };
    });
  } else {
    console.log("→ skipping weekly-brief (only runs Sun/Mon; pass --brief to force)");
  }

  console.log("→ rendering HTML...");
  const { bytes } = await renderDashboard();
  console.log(`  ✓ ${(bytes / 1024).toFixed(1)} kB (both root and /docs)`);

  console.log("✓ pipeline complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
