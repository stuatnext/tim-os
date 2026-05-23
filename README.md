# Tim OS

A **Claude Code routine** that runs Tim's brand-intelligence pipeline on a schedule, then commits an updated static HTML dashboard that's served from GitHub Pages.

Built for **Timothy Oh** — Global CMO & GM of COL Group International (ReelShort / FlareFlow).

## How it works

```
              ┌────────────────────────────────────────┐
   Scheduled  │ Claude Code routine (Sun 22:00 UTC)    │
   trigger    │                                        │
              │  1. refresh-feeds  → RSS scrape         │
              │  2. summarise      → Haiku 4.5          │
              │  3. rank-opps      → Sonnet 4.6         │
              │  4. content        → Sonnet 4.6         │
              │  5. weekly-brief   → Opus 4.7           │
              │  6. render         → docs/index.html    │
              │  7. git commit + push                   │
              └────────────────────────────────────────┘
                                ↓
                ┌──────────────────────────────────┐
                │ GitHub Pages serves docs/        │
                │ Tim opens timothyoh.github.io/   │
                └──────────────────────────────────┘
```

- **No database, no server, no Vercel** — state is JSON in `data/state/`, output is a single HTML file in `docs/`.
- **Every change is a git commit** — full audit trail of what the AI said, when, and why.
- **Mutations** ("approve draft", "mark posted", "change this week's focus") happen by chatting with Claude Code — it edits the JSON files; the next routine run regenerates the HTML.
- **Prompt caching wired in** — Tim's profile and voice bank are `cache_control: ephemeral` on every Claude call, so cached calls pay 10% on those tokens.

## Tiered model selection

| Agent | Model | Why |
|---|---|---|
| RSS summariser | `claude-haiku-4-5-20251001` | High-volume, cheap, fast triage |
| Opportunity ranker | `claude-sonnet-4-6` | Reasoning over fit, priority |
| Content generator | `claude-sonnet-4-6` | Voice-calibrated drafting |
| Weekly brief | `claude-opus-4-7` | The Monday artifact Tim reads |

## Setup

### 1. First init (local, one-time)

```bash
npm install
cp .env.example .env.local && vi .env.local   # set ANTHROPIC_API_KEY
npm run init                                   # hydrate JSON state from seed data
```

This produces `data/state/*.json` and a first `docs/index.html`.

### 2. Enable GitHub Pages

Repo Settings → Pages → Source: **Deploy from a branch** → Branch: `main` / folder: `/docs`. Tim's dashboard is now at `https://stuatnext.github.io/tim-os/`.

### 3. Wire up the Claude Code routine

In Claude Code on the web, create a **scheduled trigger** (routine) on this repo:

- **Schedule:** `0 22 * * 0` (Sunday 22:00 UTC ≈ Monday 06:00 SGT)
- **Prompt:** *"Run the Tim OS pipeline. See `CLAUDE.md` for the exact steps."*

The routine will inherit your `ANTHROPIC_API_KEY` from the Claude Code environment — no separate provisioning needed.

You can also create a more frequent routine (e.g. every 4 hours, `0 */4 * * *`) that runs `npm run pipeline -- --no-brief` to keep the intelligence feed fresh without re-running Opus.

## CLI reference

```bash
npm run init           # one-time: seed JSON state + render HTML
npm run pipeline       # full sequence: feeds → summarise → rank → content → brief → render
npm run pipeline -- --no-brief    # skip the Opus brief (between Mondays)
npm run pipeline -- --brief       # force brief regen (mid-week)
npm run render         # re-render HTML only (after manual JSON edits)

npm run agent:feeds       # one stage at a time
npm run agent:summarise
npm run agent:rank
npm run agent:content
npm run agent:brief
```

## File layout

```
tim-os/
├── docs/
│   └── index.html              # generated dashboard (served by GitHub Pages)
├── data/state/                  # state files — every change is a git commit
│   ├── settings.json            # weekly focus, voice tuning, campaign goals
│   ├── contacts.json            # Tim's network
│   ├── awards.json              # award pipeline
│   ├── speaking.json            # events
│   ├── media.json               # press targets
│   ├── press.json               # coverage record
│   ├── intelligence.json        # RSS items with AI enrichment
│   ├── content.json             # generated LinkedIn drafts
│   ├── briefs.json              # weekly briefs (latest first)
│   └── runs.json                # agent execution log
├── src/
│   ├── lib/
│   │   ├── anthropic.ts         # SDK client + model tier selection
│   │   ├── context.ts           # cached system prompt builder
│   │   ├── store.ts             # JSON file CRUD
│   │   └── data/                # CURATED knowledge — never auto-edited
│   │       ├── tim-profile.ts   # cached system prompt body
│   │       ├── voice-bank.ts    # verbatim quotes for voice calibration
│   │       ├── feed-sources.ts  # RSS sources + priority keywords
│   │       └── seed-*.ts        # initial state for contacts/awards/etc.
│   ├── agents/
│   │   ├── refresh-feeds.ts
│   │   ├── summarise.ts
│   │   ├── rank-opportunities.ts
│   │   ├── generate-content.ts
│   │   └── brief.ts
│   └── render/
│       ├── index.ts             # HTML renderer
│       └── styles.ts            # inline CSS
├── scripts/
│   ├── init.ts                  # hydrate state + first render
│   ├── run-pipeline.ts          # the routine's entry point
│   ├── render-only.ts           # render without running agents
│   └── agents.ts                # one-stage CLI
├── CLAUDE.md                    # instructions for the routine
└── README.md
```

## Mutations workflow

The HTML is read-only. To change state — approve a draft, mark an award submitted, update this week's focus — chat with Claude Code:

> *"Approve content draft sj4tzr1q3l5 and mark it as posted."*
> *"Set this week's focus to: pitch The Town, push LA recap content."*
> *"Move the Cannes Lions submission to status=submitted."*

Claude edits the relevant JSON file, commits, pushes. Next routine run re-renders the HTML.

## Editing curated knowledge

The files in `src/lib/data/` are the **curated** layer — Tim's profile, voice bank, feed sources, seed data. They never get auto-edited. Update them via PR like any other source code.
