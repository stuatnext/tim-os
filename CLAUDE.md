# Tim OS — Routine instructions

You're running on a schedule for **Tim OS**, the brand intelligence dashboard for Timothy Oh (Global CMO & GM, COL Group International). Your job each run is to keep the dashboard fresh and commit the updated HTML.

## Standard run

```bash
npm install --silent --no-audit --no-fund
npm run pipeline
```

The pipeline does all of:
1. **refresh-feeds** — pulls Variety, Deadline, THR, Campaign Asia and others, filtered to Tim's beat
2. **summarise** (Haiku 4.5) — scores each new item 0–100 for relevance, drafts a one-line angle
3. **rank-opportunities** (Sonnet 4.6) — rescores awards / speaking / media against this week's focus
4. **generate-content** (Sonnet 4.6) — three fresh LinkedIn drafts in Tim's voice
5. **weekly-brief** (Opus 4.7) — only runs on Sun/Mon UTC; skipped otherwise
6. **render** — re-emits `docs/index.html`

## Then commit + push

```bash
git add data/state docs
git commit -m "routine: weekly refresh $(date -u +%Y-%m-%d)"
git push origin main
```

If `git status` shows no changes, skip the commit (the routine produced nothing new).

## Variations

- **Mid-week intelligence-only run** (e.g. a 4-hourly routine): `npm run pipeline -- --no-brief` — keeps the news/opps fresh without burning Opus.
- **Force a brief regen** (e.g. Stuart asked): `npm run pipeline -- --brief`.
- **Render-only** (after a manual JSON edit): `npm run render`.

## Mutations from Stuart / Tim

When asked to **approve / dismiss / mark posted / update focus**, edit the relevant JSON file under `data/state/` directly. Then:

```bash
npm run render          # refresh HTML
git add data/state docs
git commit -m "edit: <what you did>"
git push origin main
```

Common edits:
- `data/state/settings.json` — `weeklyFocus`, `voiceTuning`, `campaignGoals.thisQuarter`.
- `data/state/content.json` — set `status` to `approved` / `posted` / `dismissed`.
- `data/state/awards.json` — set `status` to `submitted` / `shortlisted` / `won`.
- `data/state/speaking.json` — set `status` to `applied` / `confirmed`.

## Knowledge layer (don't auto-edit)

`src/lib/data/*.ts` — Tim's profile, voice bank, RSS sources, seed data. These are curated source code, not state. Only modify when Stuart explicitly asks.

## Failure handling

Each agent stage is independent. If one fails (e.g. Anthropic API blip), the others still run, and the run is logged to `data/state/runs.json` with status `failure`. The next routine run picks up where the last left off.

If `npm install` fails: check `package.json` against `package-lock.json`; flag to Stuart and stop.

If `git push` is rejected (someone pushed first): `git pull --rebase`, then push again.
