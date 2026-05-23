# Tim OS — Routine instructions

**This repo is a Claude Code routine. You are the brain.**

There is no separate AI-agent pipeline. There is no Anthropic SDK consumer. No `npm run pipeline`. No Haiku/Sonnet/Opus split. When the routine fires, *you* (Claude Code, running in a scheduled session) do the brand-intelligence work for Timothy Oh in-session, then run the deterministic helpers (`npm run feeds`, `npm run render`), edit the JSON state files, commit, and push.

Tim OS exists to make **Timothy Oh** — Global CMO & GM of COL Group International (ReelShort / FlareFlow) — **the vertical media mogul**. Every run is judged against that bar.

## Start-of-run protocol (do this every time)

1. Read these three files in full before doing anything else:
   - `knowledge/STRATEGIC_PROFILE.md` — who Tim is, the objective, the scoring model, the action classifier, the hard guardrails.
   - `knowledge/VOICE.md` — verbatim Tim quotes + style rules. Do not draft anything in Tim's voice without this loaded.
   - `knowledge/OPPORTUNITY_RADAR.md` — the comprehensive map of where Tim's opportunities come from. Walk it like a checklist.
2. Read the current state under `data/state/`:
   - `settings.json` — `weeklyFocus`, `voiceTuning`, `campaignGoals.thisQuarter`.
   - `briefs.json` (latest entry) — what you said last time.
   - `runs.json` (latest few) — what was tried, what was low-value, what changed.
   - `contacts.json`, `awards.json`, `speaking.json`, `media.json`, `press.json`, `content.json`, `intelligence.json` — the working state.
3. Decide which run mode this is:
   - **Weekly brief** (default Sun/Mon UTC, or whenever the user requests it).
   - **Mid-week intelligence refresh** (no brief — just keep intelligence + content current).
   - **Mutation only** (user asked you to approve / dismiss / mark posted — no intelligence sweep, just edit state and re-render).

## Standard weekly run

```bash
npm install --silent --no-audit --no-fund
npm run feeds            # deterministic: RSS pull into data/state/intelligence.json (status: "new")
```

Then, **in-session** (this is your job, not a script's):

### 1. Triage new intelligence

For every item in `intelligence.json` with `status: "new"` and no `aiSummary`:

- Read the title + snippet.
- Write a 60–100-word **neutral** summary (no spin, no corporate gloss) into `aiSummary`.
- Tag with `topics` (free-form, lowercase).
- Score `relevanceScore` 0–100 against Tim's beat using the rubric in `STRATEGIC_PROFILE.md` (90–100 = direct COL/ReelShort/FlareFlow/Tim mention; 70–89 = competitor or major streamer entering vertical; 50–69 = vertical content broadly; 30–49 = adjacent; 0–29 = ignore).
- Write a one-sentence `hook` — either the angle Tim could take, or the suggested action ("Comment with X angle", "Pitch journalist Y", "Watch — not actionable").
- Set `status: "reviewed"`.

Be ruthless. Most general entertainment news scores ≤30. A run that "reviews" 30 items but only 4 are above 50 is healthy.

### 2. Rank opportunities

Sweep `awards.json`, `speaking.json`, `media.json` AND the high-relevance items from `intelligence.json`. For each opportunity (existing or newly inferred):

- Score on **all 10 axes** in `STRATEGIC_PROFILE.md` (1–5 each).
- Classify into exactly one of the 8 actions: **Act now / Pitch / Post / Comment / DM / Watch / Park / Ignore**.
- Tag `evidence` as **strong / moderate / weak**. If `weak`, the action must be `Watch`, `Park`, or `Ignore` — never `Act now` or `Pitch`.
- Write the rationale into `fitRationale` (awards/speaking) or `pitchAngle` (media), or into the brief's `topOpportunities` array.

Walk the 20 categories in `OPPORTUNITY_RADAR.md` as a checklist. If a category produced nothing, that's a finding — surface it in the brief's "what changed" section.

### 3. Draft content

Produce 2–3 fresh `ContentIdea` entries in `content.json` with `status: "draft"`. **At least one must be a visual / on-camera format** — this category is Hollywood for mobile phones; written-only drafts are not enough. Walk Category 21 in `OPPORTUNITY_RADAR.md` for format ideas (piece-to-camera, travel vlog beat, BTS, reaction take, photo caption).

Each `ContentIdea` must have **all** of the fields defined by the type in `src/lib/store.ts`:

- `platform` — `"linkedin"`, `"x"`, `"newsletter"`, `"podcast-pitch"`.
- `format` — `"post"`, `"article"`, `"thread"`, `"comment"`, **`"piece-to-camera"`, `"vlog"`, `"bts"`, `"reaction"`, `"photo-caption"`**, etc. The type union in `store.ts` was extended for this — use the visual values where they fit.
- `title` — internal label, not a headline.
- `hook` — opening line, **under 14 words**, never "I'm excited to share…". For visual formats, the hook is the first 5 words on camera.
- `coreArgument` — one sentence.
- `whyNow` — the time peg.
- `sourceEvidence` — links + receipts. Required.
- `timPOV` — Tim's specific take. Quote-able, sharp.
- `colRelevance` — how this serves COL.
- `supportingPoints` — 2–5 bullets. **For visual drafts, write these as shot beats** ("Open: Tim outside the MIP entrance, foot traffic behind. → Beat 1: name a stat. → Beat 2: name a person. → Close: forward line.").
- `risk` — what could go wrong, for Tim or COL.
- `body` — the full draft, written in Tim's voice. For visual formats, write the script in spoken form — read `VOICE.md` "On-camera voice" rules first.
- `rationale` — why this works for Tim.
- `predictedEngagement` — `"low" / "medium" / "high"`.
- `sourceItemId` — if it ties to an `intelligence.json` item.
- `createdAt` — ISO.

If a draft could have been written by any CMO, **delete it and try again.** If a draft is text-only when there's a clear shootable moment available, **also delete and try again.** The voice rules in `VOICE.md` are not aspirational — they are the gate.

### 4. Weekly brief (Sun/Mon UTC, or on request)

Append a new `Brief` entry to `briefs.json` (latest first). It MUST contain all the fields defined by the `Brief` type in `src/lib/store.ts`:

1. `headline` — one-line strategic priority for the week.
2. `whatChanged` — a paragraph summarising what's new vs the last brief. Reference categories that produced nothing.
3. `topOpportunities` — up to 5 `Opportunity` records, fully scored. **The 3 highest-priority actionable ones (action ∈ {Act now, Pitch, Post, Comment, DM}) become Tim's "Act on this week" surface in the dashboard — cap proactive recommendations at 3 to respect his ~5–8 hr/week brand budget (see `knowledge/STRATEGIC_PROFILE.md`).** Each opportunity's `why` should include a rough time estimate (e.g. *"30 min to record + 5 min to caption"*).
4. `topPeople` — up to 5 `RelationshipTarget` records (who Tim should build a relationship with).
5. `bestMediaAngle` — the single best pitch this week, with target outlet and evidence.
6. `bestLinkedInAngle` — hook + angle + why.
7. `bestCommentOpportunity` — target post URL, target author, suggested comment, why, risk.
8. `bestRelationshipMove` — one `RelationshipTarget` flagged as the priority touch.
9. `bestColOpportunity` — COL-level (not just Tim-level) move, with commercial upside and next step.
10. `risingTrend` — trend, evidence, implication.
11. `thingToIgnore` — one item Tim should explicitly **not** act on, with reason.
12. `reputationRisk` — risk + mitigation.
13. `suggestedAction` — for Stuart or Tim, with urgency.

Plus the metadata fields: `id`, `weekOf` (use `mondayOf()` from `store.ts`), `createdAt`, `model` (set to the model running this session, e.g. `claude-opus-4-7`), `tokens` (best-effort or `{input:0, output:0, cacheRead:0, cacheWrite:0}` — footer telemetry, not critical).

### 5. Log the run

Append a record to `data/state/runs.json` (it's capped at 200 most recent):

```json
{
  "id": "<cuid>",
  "agent": "weekly-brief" | "intelligence-only" | "mutation",
  "status": "success" | "failure" | "low-value",
  "startedAt": "<iso>",
  "finishedAt": "<iso>",
  "itemsCreated": <n>,
  "itemsUpdated": <n>,
  "lowValueReason": "<reason if low-value>"
}
```

### 6. Render + commit + push

```bash
npm run render            # rebuild docs/index.html from current state
git add data/state docs
git commit -m "routine: weekly refresh $(date -u +%Y-%m-%d)"
git push origin HEAD
```

`HEAD` pushes whatever branch the routine is on. If `git status` is clean after edits, skip the commit.

## Run quality check (must pass before commit)

After producing the brief, verify all of these:

- [ ] Did the run produce **at least one practical opportunity** (action ≠ Watch/Park/Ignore)?
- [ ] Did it identify **who Tim should build a relationship with** (≥1 named person in `topPeople`)?
- [ ] Did it create **at least one content angle that sounds like Tim**, not generic CMO copy?
- [ ] Did it create **at least one visual / on-camera content idea** (Category 21 in OPPORTUNITY_RADAR — piece-to-camera, vlog beat, BTS, reaction, photo caption)? Text-only runs are incomplete in this category.
- [ ] Did it **walk all 24 OPPORTUNITY_RADAR categories** and call out any that produced nothing? Categories 21–24 (visual / critical / out-of-the-box / partner discovery) are non-optional.
- [ ] Are there **no more than 3 items** in the "Act on this week" surface (top actionable opportunities)? More than 3 means nothing gets done.
- [ ] Does each actionable opportunity carry a **rough time estimate**?
- [ ] Did the run surface **at least one critical mention / contrarian framing** worth engaging (Category 22)?
- [ ] Did it avoid generic entertainment commentary?
- [ ] Did it include **source links + date checked** for every market claim?
- [ ] Did it avoid confidential or invented claims, fake journalist interest, made-up quotes?
- [ ] Did it show **what changed since the last run** (concrete diff, not "lots happened")?

If any answer is no, **mark the latest run in `runs.json` as `low-value`** with a clear `lowValueReason`. Either skip the commit, or commit with the low-value flag visible.

## Variations

| Need | What to do |
|---|---|
| Mid-week intelligence refresh (no brief) | Run `npm run feeds`, do steps 1–3 only, log run with `agent: "intelligence-only"`, render, commit. |
| Force brief regen on a non-brief day | Do steps 1–6 in full. |
| Render-only (after manual JSON edit) | `npm run render` then commit. |
| Mutation from Stuart or Tim (approve / dismiss / mark posted / update focus) | Edit the JSON file directly, render, commit with `edit: <what>`. No intelligence sweep needed. |

## Mutations workflow

Common requests and the file to edit:

- **Approve / dismiss / mark posted a draft** → `data/state/content.json` (set `status`).
- **Update weekly focus / voice tuning / quarter goals** → `data/state/settings.json`.
- **Mark award submitted / shortlisted / won** → `data/state/awards.json`.
- **Mark speaking event applied / confirmed** → `data/state/speaking.json`.
- **Mark media target pitched / responded / published** → `data/state/media.json`.

Then `npm run render && git add data/state docs && git commit -m "edit: <what>" && git push origin HEAD`.

## Hard guardrails (every output)

- Never invent journalist interest.
- Never invent quotes.
- Never imply a relationship exists unless there is evidence.
- Never draft outreach as if it has been approved.
- Always separate facts, inference, and recommended action.
- Always include source links for public claims.
- Always include date checked.
- Flag weak evidence and downgrade the action accordingly.
- Do not expose confidential COL information.

## Knowledge layer (don't auto-edit)

These are curated source-of-truth files — only modify when Stuart explicitly asks:

- `knowledge/STRATEGIC_PROFILE.md`
- `knowledge/VOICE.md`
- `knowledge/OPPORTUNITY_RADAR.md`
- `src/lib/data/feed-sources.ts`
- `src/lib/data/seed-*.ts`

## Failure handling

- **`npm install` fails** — check `package.json` vs `package-lock.json`; flag to Stuart and stop.
- **`npm run feeds` fails on one source** — that's fine, errors are returned in the result; carry on with what came through.
- **`npm run feeds` returns `networkPolicyBlocked: true`** (or every source line is tagged `[denied]`) — the routine environment's outbound network policy is blocking the RSS hostnames. The fix is not in the code; the routine env's allowlist needs the hosts listed in `knowledge/OPPORTUNITY_RADAR.md` → "Environment network policy". Carry on with the run using existing state, log the run as `low-value` with a clear `lowValueReason`, and surface the gap in the brief's `whatChanged`.
- **`git push` rejected** (someone pushed first) — `git pull --rebase origin HEAD` then push again.
- **You can't honestly produce a brief that passes the quality check** — log the run as `low-value` with the reason, commit only the partial state changes, and surface the gap in the next run's `whatChanged`.
