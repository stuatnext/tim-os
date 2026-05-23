# Tim OS — Routine instructions

You're running on a schedule for **Tim OS**, the brand intelligence dashboard for Timothy Oh (Global CMO & GM, COL Group International).

## Strategic objective (the why)

Tim OS exists to position Timothy Oh as a **visible, sharp and characterful global voice in vertical drama, microdrama and next-generation entertainment**.

The goal is not generic marketing content. The goal is to help Tim become known as:

1. A vertical media mogul.
2. A bridge between Asian content engines and global entertainment markets.
3. A commercial operator who understands monetisation, distribution, IP, creators and audience behaviour.
4. A media personality with taste, humour, confidence and point of view.
5. A leader who can make COL Group International more visible, more connected and more commercially valuable.

Every run should answer:
- **What should Tim know?**
- **Who should Tim build a relationship with?**
- **Where should Tim be seen?**
- **What should Tim say?**
- **What opportunity should COL act on?**
- **What should be ignored?**

## What to detect & score

The agents look for signals across the full opportunity-types list (media interviews, journalist coverage, podcast guests, conferences/panels, awards, creator collabs, streamer/studio/platform relationships, investor narratives, LinkedIn angles, comment opportunities on other people's posts, microdrama trend signals, vertical commercial signals, US/Asia/global market signals, COL positioning, competitor movement, people Tim should meet/support/message).

Every opportunity is scored 1-5 on the 10 axes (Tim authority fit, COL commercial upside, microdrama relevance, media coverage potential, relationship value, personality fit, timeliness, evidence strength, ease of action, reputation risk) and classified into one of: **Act now · Pitch · Post · Comment · DM · Watch · Park · Ignore**.

Scoring rules and voice rules are in `src/lib/data/tim-profile.ts` (cached system prompt) and `src/lib/data/voice-bank.ts` (cached voice). Re-read them mentally before each agent call.

## Standard run

```bash
npm install --silent --no-audit --no-fund
npm run pipeline
```

The pipeline does all of:
1. **refresh-feeds** — pulls Variety, Deadline, THR, Campaign Asia and others, filtered to Tim's beat
2. **summarise** (Haiku 4.5) — scores each new item 0–100 for relevance, proposes an angle/action
3. **rank-opportunities** (Sonnet 4.6) — 10-axis scoring + 8-class action on awards / speaking / media
4. **generate-content** (Sonnet 4.6) — content ideas with full required fields (title, hook, coreArgument, whyNow, sourceEvidence, timPOV, colRelevance, supportingPoints, risk, body)
5. **weekly-brief** (Opus 4.7) — only Sun/Mon UTC; produces the 12 required dashboard outputs
6. **render** — re-emits `docs/index.html`

## Run quality check (must pass before commit)

After the pipeline, verify:

- [ ] Did the run produce at least one practical opportunity?
- [ ] Did it identify who Tim should build a relationship with?
- [ ] Did it create at least one content angle that sounds like Tim (not generic)?
- [ ] Did it avoid generic entertainment commentary?
- [ ] Did it include source links for market claims?
- [ ] Did it avoid confidential or invented claims?
- [ ] Did it show what changed since the last run?

If any answer is no, **mark the latest brief run as `low-value` in `data/state/runs.json`** with `lowValueReason: "<why>"` and skip the commit, OR commit with the low-value flag visible in the dashboard footer.

## Commit + push

```bash
git add data/state docs
git commit -m "routine: weekly refresh $(date -u +%Y-%m-%d)"
git push origin main
```

If `git status` shows no changes, skip the commit.

## Variations

- **Mid-week intelligence-only run** (e.g. a 4-hourly routine): `npm run pipeline -- --no-brief` — keeps news/opps fresh without burning Opus.
- **Force brief regen** (Stuart asked): `npm run pipeline -- --brief`.
- **Render-only** (after manual JSON edit): `npm run render`.

## Mutations from Stuart / Tim

When asked to **approve / dismiss / mark posted / update focus**, edit the relevant JSON file under `data/state/` directly. Then re-render and commit.

Common edits:
- `data/state/settings.json` — `weeklyFocus`, `voiceTuning`, `campaignGoals.thisQuarter`.
- `data/state/content.json` — set `status` to `approved` / `posted` / `dismissed`.
- `data/state/awards.json` — set `status` to `submitted` / `shortlisted` / `won`.
- `data/state/speaking.json` — set `status` to `applied` / `confirmed`.

## Hard guardrails (every agent call inherits these via the cached profile)

- Never invent journalist interest.
- Never invent quotes.
- Never imply a relationship exists unless there is evidence.
- Never draft outreach as if it has been approved.
- Always separate facts, inference, and recommended action.
- Always include source links for public claims.
- Always include date checked.
- Flag weak evidence (`evidence: "weak"` and `action: "Watch"` or `"Park"`).
- Do not expose confidential COL information.

## Knowledge layer (don't auto-edit)

`src/lib/data/*.ts` — Tim's profile, voice bank, RSS sources, seed data. These are curated source code, not state. Only modify when Stuart explicitly asks.

## Failure handling

Each agent stage is independent. If one fails (e.g. Anthropic API blip), the others still run, and the run is logged to `data/state/runs.json` with status `failure`. Next routine run picks up where the last left off.

If `npm install` fails: check `package.json` against `package-lock.json`; flag to Stuart and stop.

If `git push` is rejected (someone pushed first): `git pull --rebase`, then push again.
