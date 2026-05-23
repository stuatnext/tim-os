/**
 * Tim OS — HTML renderer.
 *
 * Priority-first layout: Tim opens the page and sees the headline + the
 * 3-6 things to act on this week. Everything else lives under collapsed
 * <details> sections so the page isn't overwhelming.
 */
import { promises as fs } from "fs";
import path from "path";
import {
  DOCS_DIR,
  ROOT_DIR,
  store,
  mondayOf,
  type Brief,
  type IndustryItem,
  type Opportunity,
  type ContentIdea,
  type RelationshipTarget,
} from "../lib/store";
import { STYLES } from "./styles";

// ---------- tiny HTML helpers ----------

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const date = (iso?: string) => (iso ? iso.slice(0, 10) : "");

const pill = (text: string, tone: "gray" | "teal" | "gold" | "amber" | "red" | "ink" = "gray") =>
  `<span class="pill pill-${tone}">${esc(text)}</span>`;

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const priorityTone: Record<string, "red" | "teal" | "amber" | "gray"> = {
  urgent: "red",
  high: "teal",
  medium: "amber",
  low: "gray",
};

const actionTone: Record<string, "red" | "teal" | "gold" | "amber" | "gray"> = {
  "Act now": "red",
  Pitch: "teal",
  Post: "teal",
  Comment: "gold",
  DM: "gold",
  Watch: "amber",
  Park: "gray",
  Ignore: "gray",
};

const actionPriority: Record<string, number> = {
  "Act now": 1,
  Pitch: 2,
  Post: 3,
  DM: 4,
  Comment: 5,
  Watch: 6,
  Park: 7,
  Ignore: 8,
};

function isUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

function renderSourceRef(s: string): string {
  return isUrl(s)
    ? `<a class="action-source small" href="${esc(s)}" target="_blank" rel="noopener">source ↗</a>`
    : `<div class="action-source small muted">source: ${esc(s)}</div>`;
}

function scoreSum(o: Opportunity): number {
  const s = o.scores;
  return (
    s.timAuthorityFit +
    s.colCommercialUpside +
    s.microdramaRelevance +
    s.mediaCoveragePotential +
    s.relationshipValue +
    s.personalityFit +
    s.timeliness +
    s.evidenceStrength +
    s.easeOfAction -
    s.reputationRisk
  );
}

// ---------- TOP HERO ----------

function renderHero(brief: Brief | null, stats: HeroStats): string {
  if (!brief) {
    return `
      <section class="hero">
        <div class="kicker">Tim OS · ${esc(stats.weekLabel)}</div>
        <h1 class="hero-headline">No brief yet this week.</h1>
        <p class="hero-sub">The next scheduled Claude Code routine will produce the first brief. Until then, the pipelines and intelligence below are live.</p>
        ${renderHeroChips(stats)}
      </section>`;
  }
  return `
    <section class="hero">
      <div class="kicker">Tim OS · Brief · week of ${esc(date(brief.weekOf))}</div>
      <h1 class="hero-headline">${esc(brief.headline)}</h1>
      ${brief.whatChanged ? `<p class="hero-sub">${esc(brief.whatChanged)}</p>` : ""}
      ${renderHeroChips(stats)}
    </section>`;
}

type HeroStats = {
  weekLabel: string;
  urgentDeadlines: number;
  draftsPending: number;
  highRelevanceNews: number;
  nextEventLabel: string | null;
  nextEventDays: number | null;
};

function renderHeroChips(s: HeroStats): string {
  const chips: string[] = [];
  if (s.urgentDeadlines > 0) {
    chips.push(
      `<div class="chip chip-red"><strong>${s.urgentDeadlines}</strong> urgent award deadline${s.urgentDeadlines === 1 ? "" : "s"}</div>`
    );
  }
  if (s.draftsPending > 0) {
    chips.push(
      `<div class="chip chip-teal"><strong>${s.draftsPending}</strong> draft${s.draftsPending === 1 ? "" : "s"} awaiting review</div>`
    );
  }
  if (s.nextEventLabel && s.nextEventDays !== null && s.nextEventDays >= 0) {
    chips.push(
      `<div class="chip chip-gold"><strong>${s.nextEventDays}d</strong> to ${esc(s.nextEventLabel)}</div>`
    );
  }
  if (s.highRelevanceNews > 0) {
    chips.push(
      `<div class="chip"><strong>${s.highRelevanceNews}</strong> high-relevance news item${s.highRelevanceNews === 1 ? "" : "s"}</div>`
    );
  }
  return chips.length ? `<div class="chip-row">${chips.join("")}</div>` : "";
}

// ---------- DO THIS WEEK ----------

type ActionCard = {
  rank: number;
  action: Opportunity["action"];
  title: string;
  move: string;            // the one-sentence what-to-do
  deadline?: string;
  source?: string;
  evidence?: Opportunity["evidence"];
  context?: string;        // a small "why" subtitle
};

function buildActionCards(brief: Brief): ActionCard[] {
  // Start with topOpportunities — these are the scored, classified opportunities.
  const actionable = brief.topOpportunities.filter(
    (o) => o.action !== "Watch" && o.action !== "Park" && o.action !== "Ignore"
  );

  const sorted = [...actionable].sort((a, b) => {
    const pa = actionPriority[a.action] ?? 99;
    const pb = actionPriority[b.action] ?? 99;
    if (pa !== pb) return pa - pb;
    return scoreSum(b) - scoreSum(a);
  });

  return sorted.map((o, i) => ({
    rank: i + 1,
    action: o.action,
    title: o.title,
    move: o.why,
    source: o.source,
    evidence: o.evidence,
    context: `${o.type} · evidence ${o.evidence}`,
  }));
}

function renderDoThisWeek(brief: Brief): string {
  const cards = buildActionCards(brief);
  const sa = brief.suggestedAction;

  const headCard = sa
    ? `
      <div class="action-card action-headline">
        <div class="action-pill-row">
          ${pill("Suggested action", "ink")}
          ${pill(`for ${sa.for}`, "gold")}
          ${pill(sa.urgency, "amber")}
        </div>
        <div class="action-title">${esc(sa.action)}</div>
      </div>`
    : "";

  if (cards.length === 0 && !sa) {
    return `
      <section class="do-this-week">
        <div class="section-h">
          <h2>Act on this week</h2>
        </div>
        <div class="muted small">No actionable opportunities in this brief. Either everything is in Watch/Park/Ignore, or no brief has been written yet.</div>
      </section>`;
  }

  return `
    <section class="do-this-week">
      <div class="section-h">
        <h2>Act on this week</h2>
        <div class="muted small">${cards.length} action${cards.length === 1 ? "" : "s"}${sa ? " + 1 suggested action" : ""} · sorted by priority</div>
      </div>
      ${headCard}
      <div class="action-grid">
        ${cards
          .map(
            (c) => `
            <div class="action-card">
              <div class="action-pill-row">
                ${pill(c.action, actionTone[c.action] ?? "gray")}
                ${c.evidence ? pill(`${c.evidence} evidence`, c.evidence === "strong" ? "teal" : c.evidence === "moderate" ? "amber" : "gray") : ""}
                <span class="action-rank">#${c.rank}</span>
              </div>
              <div class="action-title">${esc(c.title)}</div>
              <p class="action-move">${esc(c.move)}</p>
              ${c.context ? `<div class="action-context muted small">${esc(c.context)}</div>` : ""}
              ${c.source ? renderSourceRef(c.source) : ""}
            </div>`
          )
          .join("")}
      </div>
    </section>`;
}

// ---------- DRAFTS READY ----------

function renderDraftsReady(drafts: ContentIdea[]): string {
  const review = drafts.filter((d) => d.status === "draft").slice(0, 4);
  if (review.length === 0) return "";

  return `
    <section class="drafts-ready">
      <div class="section-h">
        <h2>Drafts ready to review</h2>
        <div class="muted small">${review.length} pending</div>
      </div>
      <div class="draft-grid">
        ${review
          .map(
            (d) => `
            <div class="draft-card">
              <div class="action-pill-row">
                ${pill(d.platform, "ink")}
                ${pill(d.format, "gray")}
                ${d.predictedEngagement ? pill(`predicted ${d.predictedEngagement}`, d.predictedEngagement === "high" ? "teal" : "gray") : ""}
              </div>
              <div class="draft-hook">"${esc(d.hook)}"</div>
              ${d.coreArgument ? `<p class="small mt-2"><span class="muted">Argument:</span> ${esc(d.coreArgument)}</p>` : ""}
              ${d.whyNow ? `<p class="small mt-2"><span class="muted">Why now:</span> ${esc(d.whyNow)}</p>` : ""}
              <details class="draft-body">
                <summary>Read full draft</summary>
                <pre>${esc(d.body)}</pre>
                ${d.timPOV ? `<p class="small mt-2"><span class="muted">Tim POV:</span> ${esc(d.timPOV)}</p>` : ""}
                ${d.colRelevance ? `<p class="small mt-2"><span class="muted">COL relevance:</span> ${esc(d.colRelevance)}</p>` : ""}
                ${d.supportingPoints?.length ? `<ul class="list mt-2">${d.supportingPoints.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
                ${d.sourceEvidence ? `<p class="small muted mt-2">Source/evidence: ${esc(d.sourceEvidence)}</p>` : ""}
                ${d.risk ? `<p class="small mt-2" style="color:var(--danger)"><span class="muted">Risk:</span> ${esc(d.risk)}</p>` : ""}
                ${d.rationale ? `<p class="small muted mt-2"><em>Why this works: ${esc(d.rationale)}</em></p>` : ""}
              </details>
            </div>`
          )
          .join("")}
      </div>
    </section>`;
}

// ---------- PEOPLE TO REACH ----------

function renderPeopleToReach(brief: Brief): string {
  const people = brief.topPeople.slice(0, 5);
  if (people.length === 0) return "";

  return `
    <section class="people-reach">
      <div class="section-h">
        <h2>People to reach</h2>
        <div class="muted small">${people.length} priorit${people.length === 1 ? "y" : "ies"} this week</div>
      </div>
      <div class="people-grid">
        ${people
          .map(
            (p) => `
            <div class="person-card priority-${p.priority}">
              <div class="row">
                <div>
                  <div class="person-name">${esc(p.name)}</div>
                  <div class="small muted">${esc(p.role ?? "")}${p.organisation ? ` · ${esc(p.organisation)}` : ""}</div>
                </div>
                ${pill(p.priority, p.priority === "high" ? "red" : p.priority === "medium" ? "teal" : "gray")}
              </div>
              <p class="small mt-2">${esc(p.whyMatters)}</p>
              <div class="small mt-2"><span class="muted">Approach:</span> ${esc(p.bestApproach)}</div>
              ${p.privateMove ? `<div class="small mt-2"><span class="muted">Move:</span> ${esc(p.privateMove)}</div>` : ""}
            </div>`
          )
          .join("")}
      </div>
    </section>`;
}

// ---------- FULL-BRIEF DETAIL ----------

function renderScores(s: Brief["topOpportunities"][number]["scores"]): string {
  const axes: Array<[string, number]> = [
    ["Tim fit", s.timAuthorityFit],
    ["COL upside", s.colCommercialUpside],
    ["MD relevance", s.microdramaRelevance],
    ["Media", s.mediaCoveragePotential],
    ["Network", s.relationshipValue],
    ["Personality", s.personalityFit],
    ["Timeliness", s.timeliness],
    ["Evidence", s.evidenceStrength],
    ["Ease", s.easeOfAction],
    ["Risk", s.reputationRisk],
  ];
  return `<div class="score-grid">${axes
    .map(
      ([k, v]) =>
        `<div class="score-cell"><div class="score-k">${esc(k)}</div><div class="score-v ${k === "Risk" && v >= 4 ? "risk-high" : ""}">${v}</div></div>`
    )
    .join("")}</div>`;
}

function renderFullBrief(brief: Brief): string {
  return `
    <details class="detail-section">
      <summary>
        <span class="detail-title">Full brief</span>
        <span class="detail-sub">All 12 sections — what changed, opportunities, people, angles, signals, risk</span>
      </summary>
      <div class="detail-body">
        <div class="card accent-gold">
          <h3>1 · What changed since last run</h3>
          <p class="brief-body">${esc(brief.whatChanged)}</p>
        </div>

        <h3 class="mt-3">2 · Top opportunities (scored)</h3>
        <div class="opps">
          ${brief.topOpportunities
            .map(
              (o, i) => `
            <div class="card opp">
              <div class="row">
                <div>
                  <div class="opp-num">${i + 1}</div>
                  <div class="opp-title">${esc(o.title)}</div>
                  <div class="small muted">${esc(o.type)} · evidence ${esc(o.evidence)}</div>
                </div>
                ${pill(o.action, actionTone[o.action] ?? "gray")}
              </div>
              <p class="small mt-2">${esc(o.why)}</p>
              ${o.source ? `<p class="small muted mt-2">${isUrl(o.source) ? `<a href="${esc(o.source)}" target="_blank" rel="noopener">source ↗</a>` : `source: ${esc(o.source)}`}${o.dateChecked ? ` · checked ${esc(o.dateChecked)}` : ""}</p>` : ""}
              ${renderScores(o.scores)}
            </div>`
            )
            .join("")}
        </div>

        <h3 class="mt-3">3 · Top people</h3>
        <div class="grid-2">
          ${brief.topPeople.map((p) => renderPersonDetail(p)).join("")}
        </div>

        <div class="grid-3 mt-3">
          <div class="card accent-gold">
            <div class="kicker">4 · Best media angle</div>
            <h3 class="mt-2">${esc(brief.bestMediaAngle.angle)}</h3>
            ${brief.bestMediaAngle.targetOutlet ? `<div class="small muted mt-2">Target: ${esc(brief.bestMediaAngle.targetOutlet)}</div>` : ""}
            <p class="small mt-2">${esc(brief.bestMediaAngle.why)}</p>
            <p class="small mt-2"><span class="muted">Evidence:</span> ${esc(brief.bestMediaAngle.evidence)}</p>
          </div>
          <div class="card accent-teal">
            <div class="kicker">5 · Best LinkedIn angle</div>
            <div class="hook mt-2">"${esc(brief.bestLinkedInAngle.hook)}"</div>
            <p class="small mt-2">${esc(brief.bestLinkedInAngle.angle)}</p>
            <p class="small muted mt-2">${esc(brief.bestLinkedInAngle.why)}</p>
          </div>
          <div class="card accent-amber">
            <div class="kicker">6 · Best comment opportunity</div>
            <div class="small muted mt-2">on ${esc(brief.bestCommentOpportunity.targetAuthor)}${brief.bestCommentOpportunity.targetPostUrl ? ` · <a href="${esc(brief.bestCommentOpportunity.targetPostUrl)}" target="_blank" rel="noopener">post</a>` : ""}</div>
            <pre class="comment-draft">${esc(brief.bestCommentOpportunity.suggestedComment)}</pre>
            <p class="small mt-2">${esc(brief.bestCommentOpportunity.why)}</p>
            <p class="small mt-2"><span class="muted">Risk:</span> ${esc(brief.bestCommentOpportunity.risk)}</p>
          </div>
        </div>

        <div class="card mt-3 accent-teal">
          <div class="kicker">7 · Best relationship move</div>
          ${renderPersonDetail(brief.bestRelationshipMove)}
        </div>

        <div class="card mt-3 accent-amber">
          <div class="kicker">8 · Best COL commercial opportunity</div>
          <h3 class="mt-2">${esc(brief.bestColOpportunity.title)}</h3>
          <p class="small mt-2">${esc(brief.bestColOpportunity.why)}</p>
          <p class="small mt-2"><span class="muted">Upside:</span> ${esc(brief.bestColOpportunity.commercialUpside)}</p>
          <p class="small mt-2"><span class="muted">Next step:</span> <strong>${esc(brief.bestColOpportunity.nextStep)}</strong></p>
        </div>

        <div class="grid-3 mt-3">
          <div class="card accent-teal">
            <div class="kicker">9 · Rising trend</div>
            <h3 class="mt-2">${esc(brief.risingTrend.trend)}</h3>
            <p class="small mt-2"><span class="muted">Evidence:</span> ${esc(brief.risingTrend.evidence)}</p>
            <p class="small mt-2"><span class="muted">Implication:</span> ${esc(brief.risingTrend.implication)}</p>
          </div>
          <div class="card">
            <div class="kicker">10 · Thing to ignore</div>
            <h3 class="mt-2">${esc(brief.thingToIgnore.item)}</h3>
            <p class="small muted mt-2">${esc(brief.thingToIgnore.why)}</p>
          </div>
          <div class="card accent-red">
            <div class="kicker">11 · Reputation risk</div>
            <p class="small mt-2"><strong>${esc(brief.reputationRisk.risk)}</strong></p>
            <p class="small mt-2"><span class="muted">Mitigation:</span> ${esc(brief.reputationRisk.mitigation)}</p>
          </div>
        </div>

        <div class="card mt-3 accent-teal">
          <div class="kicker">12 · Suggested action</div>
          <div class="row mt-2">
            <strong>${esc(brief.suggestedAction.action)}</strong>
            ${pill(`for ${brief.suggestedAction.for}`, "ink")}
            ${pill(brief.suggestedAction.urgency, "amber")}
          </div>
        </div>
      </div>
    </details>`;
}

function renderPersonDetail(p: RelationshipTarget): string {
  return `
    <div class="card accent-${p.priority === "high" ? "gold" : p.priority === "medium" ? "teal" : "amber"}">
      <div class="row">
        <div>
          <strong>${esc(p.name)}</strong>
          <div class="small muted">${esc(p.role ?? "")}${p.organisation ? ` · ${esc(p.organisation)}` : ""}</div>
        </div>
        ${pill(p.priority, p.priority === "high" ? "red" : p.priority === "medium" ? "teal" : "gray")}
      </div>
      <p class="small mt-2">${esc(p.whyMatters)}</p>
      <div class="small mt-2"><span class="muted">Tim:</span> ${esc(p.timRelevance)}</div>
      <div class="small mt-2"><span class="muted">COL:</span> ${esc(p.colRelevance)}</div>
      <div class="small mt-2"><span class="muted">Best approach:</span> ${esc(p.bestApproach)}</div>
      ${p.publicMove ? `<div class="small mt-2"><span class="muted">Public:</span> ${esc(p.publicMove)}</div>` : ""}
      ${p.privateMove ? `<div class="small mt-2"><span class="muted">Private:</span> ${esc(p.privateMove)}</div>` : ""}
      ${p.risk ? `<div class="small mt-2"><span class="muted">Risk:</span> ${esc(p.risk)}</div>` : ""}
      ${p.source ? `<p class="small muted mt-2">${isUrl(p.source) ? `<a href="${esc(p.source)}" target="_blank" rel="noopener">source ↗</a>` : `source: ${esc(p.source)}`}</p>` : ""}
    </div>`;
}

// ---------- collapsible sections (pipelines, intel, content, network, press) ----------

async function renderPipelines(): Promise<string> {
  const [awards, speaking, media] = await Promise.all([
    store.getAwards(),
    store.getSpeaking(),
    store.getMedia(),
  ]);

  const awardsSorted = [...awards].sort((a, b) => {
    const order = ["urgent", "high", "medium", "low"];
    return order.indexOf(a.priority) - order.indexOf(b.priority);
  });
  const speakingSorted = [...speaking].sort((a, b) => {
    if (!a.startsAt) return 1;
    if (!b.startsAt) return -1;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });
  const mediaSorted = [...media].sort((a, b) => a.tier - b.tier);

  return `
    <details class="detail-section">
      <summary>
        <span class="detail-title">Pipeline</span>
        <span class="detail-sub">Awards (${awards.length}) · speaking (${speaking.length}) · media (${media.length})</span>
      </summary>
      <div class="detail-body">
        <h3>Awards</h3>
        <div class="grid-2">
          ${awardsSorted
            .map((a) => {
              const days = daysUntil(a.deadline);
              return `
              <div class="card">
                <div class="row">
                  <div class="title">${esc(a.name)}</div>
                  ${pill(a.priority, priorityTone[a.priority] ?? "gray")}
                </div>
                <div class="small muted mt-2">${esc(a.organizer ?? "—")} · ${esc(a.category ?? "category TBD")}</div>
                <div class="small mt-2">
                  ${
                    a.deadline
                      ? `Deadline ${date(a.deadline)}${days !== null ? ` <span class="${days <= 14 && days >= 0 ? "" : "muted"}">(${days >= 0 ? `${days}d left` : `${-days}d overdue`})</span>` : ""}`
                      : `<span class="muted">No deadline set</span>`
                  }
                </div>
                ${a.fitScore != null ? `<div class="small mt-2">Fit <strong>${a.fitScore}/100</strong></div><div class="score-bar"><div style="width:${a.fitScore}%"></div></div>` : ""}
                ${a.fitRationale ? `<p class="small muted mt-2">${esc(a.fitRationale)}</p>` : ""}
                <div class="tag-row">${pill(a.status, "gray")}${a.feeUsd ? pill(`$${a.feeUsd}`, "amber") : ""}</div>
              </div>`;
            })
            .join("")}
        </div>

        <h3 class="mt-3">Speaking</h3>
        <div class="grid-2">
          ${speakingSorted
            .map(
              (s) => `
              <div class="card ${s.status === "confirmed" ? "accent-teal" : ""}">
                <div class="row">
                  <div class="title">${esc(s.name)}</div>
                  ${pill(s.status, s.status === "confirmed" ? "teal" : s.status === "done" ? "gray" : "gold")}
                </div>
                <div class="small muted mt-2">${esc(s.location ?? "—")} · ${date(s.startsAt) || "TBD"}</div>
                ${s.role ? `<div class="small mt-2">Role: ${esc(s.role)}</div>` : ""}
                ${s.fitRationale ? `<p class="small muted mt-2">${esc(s.fitRationale)}</p>` : ""}
              </div>`
            )
            .join("")}
        </div>

        <h3 class="mt-3">Media targets</h3>
        <div class="grid-2">
          ${mediaSorted
            .map(
              (m) => `
              <div class="card ${m.tier === 1 ? "accent-gold" : ""}">
                <div class="row">
                  <div>
                    <div class="title">${esc(m.outlet)}</div>
                    <div class="small muted">${esc(m.journalist ?? "—")} · ${esc(m.beat ?? "")}</div>
                  </div>
                  ${pill(`T${m.tier}`, m.tier === 1 ? "gold" : "gray")}
                </div>
                ${m.pitchAngle ? `<p class="small mt-2"><em>"${esc(m.pitchAngle)}"</em></p>` : ""}
                <div class="tag-row">${pill(m.status, "gray")}${m.contact ? `<span class="small muted">${esc(m.contact)}</span>` : ""}</div>
              </div>`
            )
            .join("")}
        </div>
      </div>
    </details>`;
}

async function renderIntelligence(): Promise<string> {
  const items = await store.getIntelligence();
  const sorted = [...items]
    .sort((a, b) => {
      const score = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
      if (score !== 0) return score;
      const ap = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bp = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bp - ap;
    })
    .slice(0, 25);

  return `
    <details class="detail-section">
      <summary>
        <span class="detail-title">Industry intelligence</span>
        <span class="detail-sub">${items.length === 0 ? "No items yet — npm run feeds populates this" : `Top ${sorted.length} of ${items.length} scored items`}</span>
      </summary>
      <div class="detail-body">
        ${
          sorted.length === 0
            ? `<p class="small muted">No items yet. The Claude Code routine runs <code>npm run feeds</code> to populate this from curated trade-press RSS + Google News search feeds, then scores and triages each new item in-session.</p>`
            : `<div style="display:flex; flex-direction:column; gap:10px;">
                ${sorted
                  .map(
                    (it: IndustryItem) => `
                  <div class="card">
                    <div class="row">
                      <div>
                        <div class="kicker">${esc(it.source)}</div>
                        <a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.title)}</a>
                      </div>
                      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                        ${it.relevanceScore != null ? pill(`${it.relevanceScore}/100`, it.relevanceScore >= 70 ? "teal" : it.relevanceScore >= 40 ? "amber" : "gray") : ""}
                        ${it.publishedAt ? `<span class="small muted">${date(it.publishedAt)}</span>` : ""}
                      </div>
                    </div>
                    ${it.aiSummary ? `<p class="small mt-2">${esc(it.aiSummary)}</p>` : ""}
                    ${it.hook ? `<div class="small mt-2" style="border-left:2px solid rgba(29,158,117,0.4); padding-left:10px; color:var(--accent); font-style:italic;">${esc(it.hook)}</div>` : ""}
                  </div>`
                  )
                  .join("")}
              </div>`
        }
      </div>
    </details>`;
}

async function renderContentDetail(): Promise<string> {
  const all = await store.getContent();
  if (all.length === 0) return "";

  return `
    <details class="detail-section">
      <summary>
        <span class="detail-title">All content drafts</span>
        <span class="detail-sub">${all.length} total · ${all.filter((d) => d.status === "draft").length} pending · ${all.filter((d) => d.status === "posted").length} posted</span>
      </summary>
      <div class="detail-body">
        <div style="display:flex; flex-direction:column; gap:14px;">
          ${all
            .map(
              (d) => `
              <div class="card ${d.status === "approved" || d.status === "posted" ? "accent-teal" : ""}">
                <div class="row">
                  <div>
                    ${pill(d.status, d.status === "posted" ? "ink" : d.status === "approved" ? "teal" : "gray")}
                    ${d.predictedEngagement ? pill(`predicted ${d.predictedEngagement}`, d.predictedEngagement === "high" ? "teal" : "gray") : ""}
                    <span class="small muted">${esc(d.format)}</span>
                  </div>
                  <span class="small muted">${date(d.createdAt)}</span>
                </div>
                <div class="title mt-2"><strong>${esc(d.title ?? "Untitled")}</strong></div>
                <div class="hook mt-2">"${esc(d.hook)}"</div>
                ${d.coreArgument ? `<p class="small mt-2"><span class="muted">Argument:</span> ${esc(d.coreArgument)}</p>` : ""}
                <pre>${esc(d.body)}</pre>
                ${d.sourceEvidence ? `<p class="small muted mt-2">Source/evidence: ${esc(d.sourceEvidence)}</p>` : ""}
              </div>`
            )
            .join("")}
        </div>
      </div>
    </details>`;
}

async function renderNetwork(): Promise<string> {
  const contacts = await store.getContacts();
  const tiers: Record<number, string> = {
    1: "Tier 1 — Closest allies",
    2: "Tier 2 — Active partners",
    3: "Tier 3 — Strategic targets",
  };
  const tone: Record<number, "gold" | "teal" | "amber"> = { 1: "gold", 2: "teal", 3: "amber" };

  return `
    <details class="detail-section">
      <summary>
        <span class="detail-title">Network</span>
        <span class="detail-sub">${contacts.length} contacts · ${contacts.filter((c) => c.tier === 1).length} tier 1</span>
      </summary>
      <div class="detail-body">
        ${[1, 2, 3]
          .map((tier) => {
            const items = contacts.filter((c) => c.tier === tier);
            if (items.length === 0) return "";
            return `
            <h3 class="mt-3">${tiers[tier]}</h3>
            <div class="grid-2">
              ${items
                .map(
                  (c) => `
                  <div class="card accent-${tone[tier]}">
                    <div class="row">
                      <div>
                        <div class="title">${esc(c.name)}</div>
                        <div class="small muted">${esc(c.role ?? "")}${c.company ? ` · ${esc(c.company)}` : ""}</div>
                      </div>
                      ${pill(c.category, tone[tier])}
                    </div>
                    ${c.strategicValue ? `<p class="small mt-2" style="font-style:italic;">${esc(c.strategicValue)}</p>` : ""}
                    ${c.notes ? `<p class="small muted mt-2">${esc(c.notes)}</p>` : ""}
                  </div>`
                )
                .join("")}
            </div>`;
          })
          .join("")}
      </div>
    </details>`;
}

async function renderPressDetail(): Promise<string> {
  const items = await store.getPress();
  if (items.length === 0) return "";
  const t1 = items.filter((p) => p.tier === 1);
  const t2 = items.filter((p) => p.tier === 2);

  const renderItem = (p: typeof items[number], accent: string) => `
    <div class="card ${accent}">
      <div class="row">
        <div>
          <div class="kicker">${esc(p.outlet)}</div>
          <div class="title">${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title)}</div>
          ${p.summary ? `<p class="small muted mt-2">${esc(p.summary)}</p>` : ""}
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
          ${pill(p.type, "gold")}
          ${p.publishedAt ? `<span class="small muted">${date(p.publishedAt)}</span>` : ""}
        </div>
      </div>
    </div>`;

  return `
    <details class="detail-section">
      <summary>
        <span class="detail-title">Press coverage</span>
        <span class="detail-sub">${items.length} pieces · ${t1.length} tier 1</span>
      </summary>
      <div class="detail-body">
        ${t1.length ? `<h3>Tier 1</h3><div style="display:flex; flex-direction:column; gap:10px;">${t1.map((p) => renderItem(p, "accent-gold")).join("")}</div>` : ""}
        ${t2.length ? `<h3 class="mt-3">Tier 2</h3><div style="display:flex; flex-direction:column; gap:10px;">${t2.map((p) => renderItem(p, "")).join("")}</div>` : ""}
      </div>
    </details>`;
}

async function renderFocusDetail(): Promise<string> {
  const settings = await store.getSettings();
  if (!settings.weeklyFocus && !settings.campaignGoals.thisQuarter.length) return "";
  return `
    <details class="detail-section">
      <summary>
        <span class="detail-title">Voice &amp; focus</span>
        <span class="detail-sub">Weekly focus · quarter goals · 12-month north star</span>
      </summary>
      <div class="detail-body">
        <div class="grid-2">
          ${settings.weeklyFocus ? `<div class="card accent-teal"><h3>This week</h3><p class="small">${esc(settings.weeklyFocus)}</p></div>` : ""}
          ${settings.campaignGoals.thisQuarter.length ? `<div class="card"><h3>This quarter</h3><ul class="list">${settings.campaignGoals.thisQuarter.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>` : ""}
        </div>
        ${settings.campaignGoals.twelveMonth.length ? `<div class="card mt-3"><h3>12-month north star</h3><ul class="list">${settings.campaignGoals.twelveMonth.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>` : ""}
      </div>
    </details>`;
}

// ---------- top-level renderer ----------

async function computeHeroStats(brief: Brief | null): Promise<HeroStats> {
  const [awards, speaking, news, drafts] = await Promise.all([
    store.getAwards(),
    store.getSpeaking(),
    store.getIntelligence(),
    store.getContent(),
  ]);

  const urgentDeadlines = awards.filter(
    (a) =>
      a.priority === "urgent" &&
      ["identified", "drafted"].includes(a.status) &&
      a.deadline &&
      (daysUntil(a.deadline) ?? 999) <= 30 &&
      (daysUntil(a.deadline) ?? -1) >= 0
  ).length;

  const draftsPending = drafts.filter((d) => d.status === "draft").length;

  const highRelevanceNews = news.filter((n) => (n.relevanceScore ?? 0) >= 70).length;

  const upcoming = speaking
    .filter((s) => s.startsAt && new Date(s.startsAt).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime());
  const next = upcoming[0];
  const nextEventDays = next ? daysUntil(next.startsAt) : null;
  const nextEventLabel = next ? next.name : null;

  const week = brief ? date(brief.weekOf) : date(mondayOf());
  return {
    weekLabel: `Week of ${week}`,
    urgentDeadlines,
    draftsPending,
    highRelevanceNews,
    nextEventLabel,
    nextEventDays,
  };
}

export async function renderDashboard() {
  const briefs = await store.getBriefs();
  const currentWeek = mondayOf();
  const brief = briefs.find((b) => b.weekOf === currentWeek) ?? briefs[0] ?? null;

  const drafts = await store.getContent();
  const runs = await store.getRuns();
  const lastRun = runs[0];
  const stats = await computeHeroStats(brief);

  const above = [
    renderHero(brief, stats),
    brief ? renderDoThisWeek(brief) : "",
    renderDraftsReady(drafts),
    brief ? renderPeopleToReach(brief) : "",
  ]
    .filter(Boolean)
    .join("\n");

  const below = [
    brief ? renderFullBrief(brief) : "",
    await renderFocusDetail(),
    await renderPipelines(),
    await renderContentDetail(),
    await renderIntelligence(),
    await renderNetwork(),
    await renderPressDetail(),
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Tim OS — ${brief ? esc(brief.headline.slice(0, 80)) : "Vertical Entertainment Intelligence"}</title>
<style>${STYLES}</style>
</head>
<body>
<main class="page">
  ${above}
  <div class="rule">
    <span>Details</span>
  </div>
  ${below}
  <footer class="page-footer">
    <div>
      <div class="brand">Tim OS</div>
      <div class="small muted">Brand intelligence routine for Timothy Oh — Global CMO &amp; GM, COL Group International. Singapore.</div>
    </div>
    <div class="small muted footer-meta">
      <div>Generated ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC</div>
      ${
        lastRun
          ? `<div>Last run: ${esc(lastRun.agent)} · ${esc(lastRun.status)}${lastRun.status === "low-value" && lastRun.lowValueReason ? ` <span class="footer-low">(${esc(lastRun.lowValueReason.slice(0, 200))}${lastRun.lowValueReason.length > 200 ? "…" : ""})</span>` : ""}</div>`
          : `<div>No routine runs yet</div>`
      }
    </div>
  </footer>
</main>
</body>
</html>
`;

  // Write to BOTH locations so GitHub Pages serves the dashboard whether the
  // user configured Pages source as "root" (default) or "/docs".
  await fs.mkdir(DOCS_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(DOCS_DIR, "index.html"), html, "utf-8"),
    fs.writeFile(path.join(ROOT_DIR, "index.html"), html, "utf-8"),
  ]);
  return { bytes: html.length };
}
