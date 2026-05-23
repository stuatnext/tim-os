# Tim OS

A live brand & opportunity intelligence dashboard for **Timothy Oh** — Global CMO & GM of COL Group International (ReelShort / FlareFlow).

Tim OS continuously:

1. **Scours the web** for industry signals across Variety, Deadline, The Hollywood Reporter, Campaign Asia, TechCrunch and friends — filtered to Tim's beat (micro-drama, vertical content, COL/FlareFlow/ReelShort, competitors).
2. **Summarises and scores** every relevant item against Tim's positioning (Haiku 4.5).
3. **Re-ranks opportunities** — awards, speaking, media pitches — against this week's campaign focus (Sonnet 4.6).
4. **Generates LinkedIn drafts** in Tim's voice from a cached voice bank of his verbatim quotes (Sonnet 4.6).
5. **Produces a weekly Monday brief** — the artifact Tim opens with his first coffee, Opus 4.7 reasoning over the week's intelligence.

It's a self-service Next.js dashboard Tim uses to approve drafts, mark awards submitted, and tune his voice.

## Architecture

- **Next.js 15** App Router with React server components.
- **Prisma + SQLite** (swap to Postgres in production by changing the `provider` in `prisma/schema.prisma`).
- **Anthropic SDK** with prompt caching: Tim's profile and voice bank are marked `cache_control: ephemeral` on every call.
- **Tailwind** with a custom palette (ink / paper / accent gold).
- **Tiered model selection**:
  - `claude-haiku-4-5-20251001` → RSS summariser (cheap, high-volume).
  - `claude-sonnet-4-6` → opportunity ranker & content generator (reasoning + voice).
  - `claude-opus-4-7` → weekly brief (the artifact Tim reads).

## Quickstart

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# Edit .env.local and set ANTHROPIC_API_KEY (and optionally AGENT_SECRET)

# 3. Database
npm run db:push     # create schema
npm run db:seed     # hydrate from Tim's intelligence repos

# 4. Dev server
npm run dev
# → http://localhost:3000
```

## Agents

| Agent | Model | Endpoint | Cron |
|---|---|---|---|
| RSS refresh | n/a | `POST /api/feeds/refresh` | every 30 min |
| Summariser | Haiku 4.5 | `POST /api/agents/summarise` | every hour |
| Opportunity ranker | Sonnet 4.6 | `POST /api/agents/rank-opportunities` | daily |
| Content generator | Sonnet 4.6 | `POST /api/agents/generate-content` | on-demand from UI |
| Weekly brief | Opus 4.7 | `POST /api/agents/brief` | Mondays 06:00 SGT |

All `/api/agents/*` and `/api/feeds/*` endpoints check `Authorization: Bearer $AGENT_SECRET`. Leave `AGENT_SECRET` empty in local dev to disable.

Or run the whole pipeline locally:

```bash
npm run agents:run
```

## Dashboard pages

- **Brief** — Tim's Monday morning artifact (industry digest, top actions, content suggestions, relationship moves, opportunity focus).
- **Opportunities** — awards, speaking, media targets. Re-rank with one click.
- **Intelligence** — the industry feed, scored 0-100 for relevance, with a one-line hook for each.
- **Content** — generated LinkedIn drafts; approve / dismiss / mark posted.
- **Relationships** — Tim's network grouped by tier.
- **Press** — coverage record (source of truth for the press kit).
- **Voice & focus** — tune the AI: set this week's focus, add voice tuning notes.
- **Agent runs** — observability for every agent execution.

## Production

The repo deploys cleanly to Cloud Run alongside Tim's existing press kit. Recommended setup:

1. Swap Prisma to Postgres (Cloud SQL).
2. Set `ANTHROPIC_API_KEY`, `AGENT_SECRET`, `DATABASE_URL` as Cloud Run env vars.
3. Wire **Cloud Scheduler** jobs to the cron-callable endpoints above.
4. Optional: front the dashboard with IAP so only Tim and Stuart can hit it.

## Files of interest

- `src/lib/data/tim-profile.ts` — the cached system prompt every agent reads.
- `src/lib/data/voice-bank.ts` — Tim's verbatim quotes, used for voice calibration.
- `src/lib/context.ts` — builds the cached system block (the prompt-caching plumbing).
- `src/lib/agents/brief.ts` — the Opus weekly brief agent.
- `prisma/schema.prisma` — the data model (Contact, Award, SpeakingEvent, MediaTarget, IndustryItem, ContentIdea, Brief, AgentRun, Settings).
