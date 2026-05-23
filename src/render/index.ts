/**
 * Tim OS — HTML renderer.
 *
 * Tabbed layout with a side nav. Tim opens the page → lands on "This week"
 * → sees the priority surface (hero + actions + drafts + people). Other
 * tabs swap the main content area on click. Mobile: the side nav collapses
 * to a sticky horizontal scrolling tab bar at the top.
 *
 * Pure HTML + ~30 lines of inline JS for tab switching + hash routing.
 * No CDNs, no fonts, fully self-contained.
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

// ---------- THIS WEEK panel ----------

type HeroStats = {
  weekLabel: string;
  urgentDeadlines: number;
  draftsPending: number;
  highRelevanceNews: number;
  nextEventLabel: string | null;
  nextEventDays: number | null;
};

function renderHero(brief: Brief | null, stats: HeroStats): string {
  if (!brief) {
    return `
      <section class="hero">
        <div class="kicker">Tim OS · ${esc(stats.weekLabel)}</div>
        <h1 class="hero-headline">No brief yet this week.</h1>
        <p class="hero-sub">The next scheduled Claude Code routine will produce the first brief. Until then, the pipelines and intelligence on the other tabs are live.</p>
        ${renderHeroChips(stats)}
      </section>`;
  }
  return `
    <section class="hero">
      <div class="kicker">Brief · week of ${esc(date(brief.weekOf))}</div>
      <h1 class="hero-headline">${esc(brief.headline)}</h1>
      ${brief.whatChanged ? `<p class="hero-sub">${esc(brief.whatChanged)}</p>` : ""}
      ${renderHeroChips(stats)}
    </section>`;
}

function renderHeroChips(s: HeroStats): string {
  const chips: string[] = [];
  if (s.urgentDeadlines > 0) {
    chips.push(`<div class="chip chip-red"><strong>${s.urgentDeadlines}</strong> urgent award deadline${s.urgentDeadlines === 1 ? "" : "s"}</div>`);
  }
  if (s.draftsPending > 0) {
    chips.push(`<div class="chip chip-teal"><strong>${s.draftsPending}</strong> draft${s.draftsPending === 1 ? "" : "s"} awaiting review</div>`);
  }
  if (s.nextEventLabel && s.nextEventDays !== null && s.nextEventDays >= 0) {
    chips.push(`<div class="chip chip-gold"><strong>${s.nextEventDays}d</strong> to ${esc(s.nextEventLabel)}</div>`);
  }
  if (s.highRelevanceNews > 0) {
    chips.push(`<div class="chip"><strong>${s.highRelevanceNews}</strong> high-relevance news item${s.highRelevanceNews === 1 ? "" : "s"}</div>`);
  }
  return chips.length ? `<div class="chip-row">${chips.join("")}</div>` : "";
}

type ActionCard = {
  rank: number;
  action: Opportunity["action"];
  title: string;
  move: string;
  source?: string;
  evidence?: Opportunity["evidence"];
  context?: string;
};

function buildActionCards(brief: Brief): ActionCard[] {
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
    return `<div class="muted small">No actionable opportunities in this brief.</div>`;
  }

  return `
    <div class="section-h">
      <h2>Act on this week</h2>
      <div class="muted small">${cards.length} action${cards.length === 1 ? "" : "s"}${sa ? " + 1 suggested" : ""} · priority order</div>
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
    </div>`;
}

function renderDraftsReady(drafts: ContentIdea[]): string {
  const review = drafts.filter((d) => d.status === "draft").slice(0, 4);
  if (review.length === 0) return "";
  return `
    <div class="section-h mt-5">
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
    </div>`;
}

function renderPeopleToReach(brief: Brief): string {
  const people = brief.topPeople.slice(0, 5);
  if (people.length === 0) return "";
  return `
    <div class="section-h mt-5">
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
    </div>`;
}

// ---------- BRIEF panel ----------

function renderScores(s: Opportunity["scores"]): string {
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

function renderFullBrief(brief: Brief): string {
  return `
    <div class="section-h">
      <h2>Full brief · week of ${esc(date(brief.weekOf))}</h2>
      <div class="muted small">All 12 sections</div>
    </div>
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
    </div>`;
}

// ---------- PIPELINE panel ----------

async function renderPipelinePanel(): Promise<string> {
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
    <div class="section-h">
      <h2>Pipeline</h2>
      <div class="muted small">${awards.length} awards · ${speaking.length} speaking · ${media.length} media targets</div>
    </div>

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
    </div>`;
}

// ---------- CONTENT panel ----------

async function renderContentPanel(): Promise<string> {
  const all = await store.getContent();

  if (all.length === 0) {
    return `
      <div class="section-h"><h2>Content</h2></div>
      <p class="small muted">No drafts yet. The Claude Code routine produces 1–3 drafts per weekly run, written in Tim's voice from <code>knowledge/VOICE.md</code>.</p>`;
  }

  return `
    <div class="section-h">
      <h2>Content</h2>
      <div class="muted small">${all.length} total · ${all.filter((d) => d.status === "draft").length} pending · ${all.filter((d) => d.status === "posted").length} posted</div>
    </div>
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
    </div>`;
}

// ---------- INTELLIGENCE panel ----------

async function renderIntelligencePanel(): Promise<string> {
  const items = await store.getIntelligence();
  const sorted = [...items]
    .sort((a, b) => {
      const score = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
      if (score !== 0) return score;
      const ap = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bp = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bp - ap;
    })
    .slice(0, 50);

  if (sorted.length === 0) {
    return `
      <div class="section-h"><h2>Industry intelligence</h2></div>
      <div class="empty-state">
        <div class="empty-state-title">No items yet</div>
        <p class="small muted">The routine runs <code>npm run feeds</code> to populate this from curated trade-press RSS + Google News search feeds, then scores and triages each new item in-session.</p>
        <p class="small muted mt-2">If you see no items after a scheduled run, check whether the routine environment's network policy allows outbound to the RSS hosts listed in <code>knowledge/OPPORTUNITY_RADAR.md</code>.</p>
      </div>`;
  }

  return `
    <div class="section-h">
      <h2>Industry intelligence</h2>
      <div class="muted small">Top ${sorted.length} of ${items.length} scored items</div>
    </div>
    <div style="display:flex; flex-direction:column; gap:10px;">
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
    </div>`;
}

// ---------- NETWORK panel ----------

async function renderNetworkPanel(): Promise<string> {
  const contacts = await store.getContacts();
  const tiers: Record<number, string> = {
    1: "Tier 1 — Closest allies",
    2: "Tier 2 — Active partners",
    3: "Tier 3 — Strategic targets",
  };
  const tone: Record<number, "gold" | "teal" | "amber"> = { 1: "gold", 2: "teal", 3: "amber" };

  return `
    <div class="section-h">
      <h2>Network</h2>
      <div class="muted small">${contacts.length} contacts</div>
    </div>
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
      .join("")}`;
}

// ---------- PRESS panel ----------

async function renderPressPanel(): Promise<string> {
  const items = await store.getPress();
  if (items.length === 0) {
    return `<div class="section-h"><h2>Press coverage</h2></div><p class="small muted">No coverage logged yet.</p>`;
  }
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
    <div class="section-h">
      <h2>Press coverage</h2>
      <div class="muted small">${items.length} pieces · ${t1.length} tier 1</div>
    </div>
    ${t1.length ? `<h3>Tier 1</h3><div style="display:flex; flex-direction:column; gap:10px;">${t1.map((p) => renderItem(p, "accent-gold")).join("")}</div>` : ""}
    ${t2.length ? `<h3 class="mt-3">Tier 2</h3><div style="display:flex; flex-direction:column; gap:10px;">${t2.map((p) => renderItem(p, "")).join("")}</div>` : ""}`;
}

// ---------- FOCUS panel ----------

async function renderFocusPanel(): Promise<string> {
  const settings = await store.getSettings();
  return `
    <div class="section-h"><h2>Voice &amp; focus</h2></div>
    <div class="grid-2">
      ${settings.weeklyFocus ? `<div class="card accent-teal"><h3>This week</h3><p class="small">${esc(settings.weeklyFocus)}</p></div>` : ""}
      ${settings.campaignGoals.thisQuarter.length ? `<div class="card"><h3>This quarter</h3><ul class="list">${settings.campaignGoals.thisQuarter.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>` : ""}
    </div>
    ${settings.campaignGoals.twelveMonth.length ? `<div class="card mt-3"><h3>12-month north star</h3><ul class="list">${settings.campaignGoals.twelveMonth.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>` : ""}`;
}

// ---------- stats + dashboard assembly ----------

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

type TabSpec = {
  id: string;
  title: string;
  sub: string;
  badge?: number;
};

const TAB_SCRIPT = `
(function() {
  const tabs = Array.from(document.querySelectorAll('[data-tab]'));
  const panels = Array.from(document.querySelectorAll('[data-panel]'));
  const valid = new Set(panels.map(p => p.dataset.panel));
  function activate(name) {
    if (!valid.has(name)) name = panels[0] && panels[0].dataset.panel;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === name));
    document.title = document.title.replace(/^[^—]*—\\s*/, '');
    const t = tabs.find(t => t.dataset.tab === name);
    if (t) document.title = (t.dataset.title || name) + ' — ' + document.title;
    if (location.hash.slice(1) !== name) history.replaceState(null, '', '#' + name);
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const active = sidebar.querySelector('.nav-link.active');
      if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
    }
    window.scrollTo({ top: 0 });
  }
  tabs.forEach(t => t.addEventListener('click', e => { e.preventDefault(); activate(t.dataset.tab); }));
  window.addEventListener('hashchange', () => activate(location.hash.slice(1)));
  activate(location.hash.slice(1) || (panels[0] && panels[0].dataset.panel));
})();
`.trim();

export async function renderDashboard() {
  const briefs = await store.getBriefs();
  const currentWeek = mondayOf();
  const brief = briefs.find((b) => b.weekOf === currentWeek) ?? briefs[0] ?? null;
  const drafts = await store.getContent();
  const runs = await store.getRuns();
  const lastRun = runs[0];
  const stats = await computeHeroStats(brief);

  const [awards, speaking, media, contacts, press, intel] = await Promise.all([
    store.getAwards(),
    store.getSpeaking(),
    store.getMedia(),
    store.getContacts(),
    store.getPress(),
    store.getIntelligence(),
  ]);

  // Tab specs — order matters; first one is the default.
  const tabs: TabSpec[] = [
    { id: "week", title: "This week", sub: "Act on now", badge: brief ? buildActionCards(brief).length : 0 },
    { id: "brief", title: "Full brief", sub: "All 12 sections" },
    { id: "pipeline", title: "Pipeline", sub: "Awards · speaking · media", badge: awards.length + speaking.length + media.length },
    { id: "content", title: "Content", sub: `${drafts.filter((d) => d.status === "draft").length} pending` , badge: drafts.length },
    { id: "intelligence", title: "Intelligence", sub: "News feed", badge: intel.length },
    { id: "network", title: "Network", sub: "Tim's contacts", badge: contacts.length },
    { id: "press", title: "Press", sub: "Coverage record", badge: press.length },
    { id: "focus", title: "Voice & focus", sub: "Weekly · quarter" },
  ];

  // Build panels. "week" is always present; other panels depend on data.
  const weekPanel = `
    ${renderHero(brief, stats)}
    ${brief ? `<section class="week-section">${renderDoThisWeek(brief)}</section>` : ""}
    ${renderDraftsReady(drafts)}
    ${brief ? renderPeopleToReach(brief) : ""}
  `;

  const briefPanel = brief
    ? renderFullBrief(brief)
    : `<div class="section-h"><h2>Full brief</h2></div><p class="small muted">No brief yet. The next scheduled Claude Code routine will produce one.</p>`;

  const panels: Array<[string, string]> = [
    ["week", weekPanel],
    ["brief", briefPanel],
    ["pipeline", await renderPipelinePanel()],
    ["content", await renderContentPanel()],
    ["intelligence", await renderIntelligencePanel()],
    ["network", await renderNetworkPanel()],
    ["press", await renderPressPanel()],
    ["focus", await renderFocusPanel()],
  ];

  const sidebar = `
    <aside class="sidebar">
      <div class="brand-block">
        <div class="brand">Tim OS</div>
        <div class="brand-sub">Brand intelligence routine</div>
      </div>
      <nav class="nav-list">
        ${tabs
          .map(
            (t) => `
          <a class="nav-link" href="#${t.id}" data-tab="${t.id}" data-title="${esc(t.title)}">
            <span class="nav-row">
              <span class="nav-title">${esc(t.title)}</span>
              ${typeof t.badge === "number" && t.badge > 0 ? `<span class="nav-badge">${t.badge}</span>` : ""}
            </span>
            <span class="nav-sub">${esc(t.sub)}</span>
          </a>`
          )
          .join("")}
      </nav>
      <div class="sidebar-foot">
        <strong>Tim Oh</strong>
        Global CMO &amp; GM, COL Group International<br>
        Singapore · linkedin.com/in/timjalvin
      </div>
    </aside>`;

  const panelsHtml = panels
    .map(
      ([id, body]) => `<section class="panel" data-panel="${id}">${body}</section>`
    )
    .join("\n");

  const titlePrefix = brief ? brief.headline.slice(0, 80) : "Vertical entertainment intelligence";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Tim OS — ${esc(titlePrefix)}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="layout">
  ${sidebar}
  <main class="main">
    ${panelsHtml}
    <footer class="page-footer">
      <div class="small muted">Generated ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC</div>
      ${
        lastRun
          ? `<div class="footer-run">
              <span class="small muted">Last run:</span>
              <span class="footer-run-agent small">${esc(lastRun.agent)}</span>
              ${pill(lastRun.status, lastRun.status === "success" ? "teal" : lastRun.status === "low-value" ? "amber" : "red")}
              ${
                lastRun.status === "low-value" && lastRun.lowValueReason
                  ? `<details class="footer-why">
                      <summary class="small muted">why?</summary>
                      <p class="small">${esc(lastRun.lowValueReason)}</p>
                    </details>`
                  : ""
              }
            </div>`
          : `<div class="small muted">No routine runs yet</div>`
      }
    </footer>
  </main>
</div>
<script>${TAB_SCRIPT}</script>
</body>
</html>
`;

  await fs.mkdir(DOCS_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(DOCS_DIR, "index.html"), html, "utf-8"),
    fs.writeFile(path.join(ROOT_DIR, "index.html"), html, "utf-8"),
  ]);
  return { bytes: html.length };
}
