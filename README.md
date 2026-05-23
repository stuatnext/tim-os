# Tim OS

A **Claude Code routine** that does brand-intelligence work for **Timothy Oh** — Global CMO & GM of COL Group International (ReelShort / FlareFlow) — and renders a static dashboard served from GitHub Pages.

There's no separate AI-agent pipeline, no Anthropic SDK consumer, no model orchestration. When the scheduled routine fires, Claude Code itself runs in a session, does the work, edits the JSON state files, runs the render, commits, and pushes.

## How it works

```
              ┌────────────────────────────────────────────┐
   Scheduled  │ Claude Code routine (e.g. Sun 22:00 UTC)   │
   trigger    │                                            │
              │   1. Read knowledge/* + data/state/*       │
              │   2. npm run feeds  (deterministic RSS)    │
              │   3. Triage intelligence in-session        │
              │   4. Score + classify opportunities        │
              │   5. Draft content in Tim's voice          │
              │   6. Write the weekly brief                │
              │   7. npm run render                        │
              │   8. git commit + push                     │
              └────────────────────────────────────────────┘
                                ↓
                ┌──────────────────────────────────┐
                │ GitHub Pages serves /docs        │
                │ Tim opens the dashboard URL      │
                └──────────────────────────────────┘
```

Key properties:

- **No database, no server, no Vercel.** State is JSON in `data/state/`. Output is one HTML file in `docs/`.
- **Every change is a git commit.** Full audit trail — `git log data/state/briefs.json` is the brief history.
- **Mutations** ("approve draft", "mark posted", "change this week's focus") happen by chatting with Claude Code; it edits the JSON files; the next render reflects them.
- **No `ANTHROPIC_API_KEY` needed.** The "model" doing the thinking is Claude Code's own session — no SDK calls.

## Routine instructions

The contract Claude Code follows on every run lives in [`CLAUDE.md`](./CLAUDE.md). The strategic + voice + radar context lives in [`knowledge/`](./knowledge):

- [`knowledge/STRATEGIC_PROFILE.md`](./knowledge/STRATEGIC_PROFILE.md) — who Tim is, the objective, the 10-axis scoring model, the 8-class action classifier, the hard guardrails.
- [`knowledge/VOICE.md`](./knowledge/VOICE.md) — verbatim Tim quotes + style rules.
- [`knowledge/OPPORTUNITY_RADAR.md`](./knowledge/OPPORTUNITY_RADAR.md) — the comprehensive map of where Tim's opportunities come from (20 categories, with named sources per category).

## Setup

### 1. First init (local, one-time)

```bash
npm install
npm run init     # hydrate data/state/*.json from curated seed data, then render
```

This produces `data/state/*.json` and a first `docs/index.html`.

### 2. Enable GitHub Pages

Repo Settings → Pages → Source: **Deploy from a branch** → Branch: `main` / folder: `/docs`. The dashboard is then live at `https://stuatnext.github.io/tim-os/`.

### 3. Wire up the Claude Code routine

In Claude Code on the web, create a **scheduled trigger** on this repo:

- **Schedule:** `0 22 * * 0` (Sunday 22:00 UTC ≈ Monday 06:00 SGT) for the weekly brief.
- **Prompt:** *"Run the weekly Tim OS routine. Follow `CLAUDE.md`."*

For mid-week refreshes that skip the weekly brief, add a second routine on a more frequent schedule (e.g. `0 */6 * * *`) with the prompt *"Mid-week intelligence refresh for Tim OS. Follow `CLAUDE.md` — no brief."*

## CLI reference

```bash
npm run init       # one-time: seed JSON state + first render
npm run feeds      # pull curated RSS sources into intelligence.json (status: "new")
npm run render     # re-emit docs/index.html from current state
```

That's it. Everything else — summarising, scoring, drafting, the brief — is Claude Code's job in-session.

## File layout

```
tim-os/
├── CLAUDE.md                       # routine contract (read by Claude Code on every run)
├── README.md                       # this file
├── knowledge/                      # curated source-of-truth — don't auto-edit
│   ├── STRATEGIC_PROFILE.md
│   ├── VOICE.md
│   └── OPPORTUNITY_RADAR.md
├── docs/
│   └── index.html                  # generated dashboard (GitHub Pages serves this)
├── data/state/                     # state — every change is a git commit
│   ├── settings.json               # weekly focus, voice tuning, quarter goals
│   ├── contacts.json               # Tim's network
│   ├── awards.json                 # award pipeline
│   ├── speaking.json               # events
│   ├── media.json                  # press targets
│   ├── press.json                  # coverage record
│   ├── intelligence.json           # RSS items + Claude Code's triage
│   ├── content.json                # generated drafts
│   ├── briefs.json                 # weekly briefs (latest first)
│   └── runs.json                   # routine execution log
├── src/
│   ├── lib/
│   │   ├── store.ts                # JSON CRUD + type definitions
│   │   ├── feeds.ts                # deterministic RSS fetch
│   │   └── data/                   # curated knowledge — never auto-edited
│   │       ├── feed-sources.ts     # RSS sources + priority keywords
│   │       └── seed-*.ts           # initial state for contacts/awards/etc.
│   └── render/
│       ├── index.ts                # HTML renderer
│       └── styles.ts               # inline CSS
└── scripts/
    ├── init.ts                     # seed state + first render
    ├── fetch-feeds.ts              # `npm run feeds`
    └── render-only.ts              # `npm run render`
```

## Mutations workflow

The HTML is read-only. To change state — approve a draft, mark an award submitted, update this week's focus — chat with Claude Code:

> *"Approve content draft sj4tzr1q3l5 and mark it as posted."*
> *"Set this week's focus to: pitch The Town, push LA recap content."*
> *"Move the Cannes Lions submission to status=submitted."*

Claude Code edits the JSON, runs `npm run render`, commits, pushes. The dashboard updates on next GitHub Pages publish.

## Editing curated knowledge

The files in `knowledge/` and `src/lib/data/` are the curated layer — Tim's profile, voice bank, opportunity radar, RSS sources, seed data. They're never auto-edited by the routine. Update them via PR like any other source code.
