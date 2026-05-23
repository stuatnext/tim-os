/**
 * Render-only — re-emit docs/index.html from current state without running
 * any agents. Useful after manual edits to data/state/*.json.
 *
 *   npm run render
 */
import { renderDashboard } from "../src/render";

async function main() {
  const { bytes } = await renderDashboard();
  console.log(`✓ docs/index.html · ${(bytes / 1024).toFixed(1)} kB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
