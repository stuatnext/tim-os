/**
 * Tim OS — HTML renderer.
 *
 * Reads every state file from data/state/*.json and emits a single static
 * docs/index.html. The dashboard surfaces the 12 required brief outputs
 * plus the supporting state (opportunities, intelligence, relationships,
 * press).
 */
import { promises as fs } from "fs";
import path from "path";
import { DOCS_DIR, ROOT_DIR, store, mondayOf, type Brief, type IndustryItem } from "../lib/store";
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

// ---------- section renderers ----------

function renderEmptyBrief(): string {
  return `
    <section class="hero" id="brief">
      <div class="kicker">Brief</div>
      <div class="headline">Run the routine to generate this week's brief.</div>
      <p class="muted small">Once the Claude Code routine runs on Sunday night, Opus will synthesise the last 14 days of intelligence into the 12 Monday-morning outputs: what changed, top opportunities, top people, best media/LinkedIn/comment/relationship/COL angle, rising trend, what to ignore, reputation risk, and the suggested next action.</p>
    </section>`;
}

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

function renderBrief(brief: Brief): string {
  return `
    <section class="hero" id="brief">
      <div class="kicker">Brief · week of ${date(brief.weekOf)}</div>
      <div class="headline">${esc(brief.headline)}</div>

      <div class="card mt-3 accent-gold">
        <h3>1 · What changed since last run</h3>
        <div class="brief-body">${esc(brief.whatChanged)}</div>
      </div>

      <div class="grid-2 mt-3">
        <div class="card accent-teal">
          <h3>12 · Suggested action</h3>
          <div class="row">
            <strong>${esc(brief.suggestedAction.action)}</strong>
            ${pill(`for ${brief.suggestedAction.for}`, "ink")}
            ${pill(brief.suggestedAction.urgency, "amber")}
          </div>
        </div>
        <div class="card accent-amber">
          <h3>8 · Best COL commercial opportunity</h3>
          <div><strong>${esc(brief.bestColOpportunity.title)}</strong></div>
          <p class="small mt-2">${esc(brief.bestColOpportunity.why)}</p>
          <p class="small mt-2"><span class="muted">Upside:</span> ${esc(brief.bestColOpportunity.commercialUpside)}</p>
          <p class="small mt-2"><span class="muted">Next step:</span> <strong>${esc(brief.bestColOpportunity.nextStep)}</strong></p>
        </div>
      </div>
    </section>

    <section id="top-opps">
      <div class="kicker">2 · Top opportunities</div>
      <h2>What Tim should act on</h2>
      <div class="opps">
        ${brief.topOpportunities
          .map((o, i) => `
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
            ${o.source ? `<p class="small muted mt-2"><a href="${esc(o.source)}" target="_blank" rel="noopener">source</a>${o.dateChecked ? ` · checked ${esc(o.dateChecked)}` : ""}</p>` : ""}
            ${renderScores(o.scores)}
          </div>`)
          .join("")}
      </div>
    </section>

    <section id="top-people">
      <div class="kicker">3 · Top people</div>
      <h2>Who Tim should know</h2>
      <div class="grid-2">
        ${brief.topPeople
          .map((p) => `
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
            ${p.source ? `<p class="small muted mt-2"><a href="${esc(p.source)}" target="_blank" rel="noopener">source</a></p>` : ""}
          </div>`)
          .join("")}
      </div>
    </section>

    <section id="angles">
      <div class="kicker">Angles</div>
      <h2>What Tim should say & where</h2>
      <div class="grid-3">
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
        <div class="row mt-2">
          <div>
            <strong>${esc(brief.bestRelationshipMove.name)}</strong>
            <div class="small muted">${esc(brief.bestRelationshipMove.role ?? "")}${brief.bestRelationshipMove.organisation ? ` · ${esc(brief.bestRelationshipMove.organisation)}` : ""}</div>
          </div>
          ${pill(brief.bestRelationshipMove.priority, "teal")}
        </div>
        <p class="small mt-2">${esc(brief.bestRelationshipMove.whyMatters)}</p>
        <div class="small mt-2"><span class="muted">Approach:</span> ${esc(brief.bestRelationshipMove.bestApproach)}</div>
        ${brief.bestRelationshipMove.publicMove ? `<div class="small mt-2"><span class="muted">Public:</span> ${esc(brief.bestRelationshipMove.publicMove)}</div>` : ""}
        ${brief.bestRelationshipMove.privateMove ? `<div class="small mt-2"><span class="muted">Private:</span> ${esc(brief.bestRelationshipMove.privateMove)}</div>` : ""}
      </div>
    </section>

    <section id="signals">
      <div class="kicker">Market signals</div>
      <h2>Trends, ignores, and risk</h2>
      <div class="grid-3">
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
    </section>`;
}

async function renderOpportunities(): Promise<string> {
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
    <section id="opportunities">
      <div class="kicker">Pipeline</div>
      <h2>Awards · speaking · media</h2>

      <h3 class="mt-3">Awards</h3>
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
    </section>`;
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

  if (sorted.length === 0) {
    return `
      <section id="intelligence">
        <div class="kicker">Intelligence</div>
        <h2>Industry feed</h2>
        <div class="card">
          <p class="small muted">No items yet. The feed-refresh routine pulls from Variety, Deadline, THR, Campaign Asia and others, filtered to Tim's beat keywords. The summariser scores each item 0–100 and proposes an action class.</p>
        </div>
      </section>`;
  }

  return `
    <section id="intelligence">
      <div class="kicker">Intelligence</div>
      <h2>Industry feed</h2>
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
      </div>
    </section>`;
}

async function renderContent(): Promise<string> {
  const all = await store.getContent();
  const drafts = all.slice(0, 12);

  if (drafts.length === 0) {
    return `
      <section id="content">
        <div class="kicker">Content</div>
        <h2>LinkedIn drafts</h2>
        <div class="card">
          <p class="small muted">No drafts yet. The content agent generates drafts with the full required field set — title, hook, coreArgument, whyNow, sourceEvidence, timPOV, colRelevance, supportingPoints, risk, body — in Tim's voice from the cached voice bank.</p>
        </div>
      </section>`;
  }

  return `
    <section id="content">
      <div class="kicker">Content</div>
      <h2>LinkedIn drafts</h2>
      <div style="display:flex; flex-direction:column; gap:14px;">
        ${drafts
          .map(
            (d) => `
            <div class="card draft ${d.status === "approved" ? "accent-teal" : ""}">
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
              ${d.whyNow ? `<p class="small mt-2"><span class="muted">Why now:</span> ${esc(d.whyNow)}</p>` : ""}
              ${d.timPOV ? `<p class="small mt-2"><span class="muted">Tim POV:</span> ${esc(d.timPOV)}</p>` : ""}
              <pre>${esc(d.body)}</pre>
              ${d.sourceEvidence ? `<p class="small muted mt-2"><span>Source/evidence:</span> ${esc(d.sourceEvidence)}</p>` : ""}
              ${d.risk ? `<p class="small mt-2" style="color:var(--danger)"><span class="muted">Risk:</span> ${esc(d.risk)}</p>` : ""}
              ${d.rationale ? `<div class="meta">Why this works: ${esc(d.rationale)}</div>` : ""}
            </div>`
          )
          .join("")}
      </div>
    </section>`;
}

async function renderRelationships(): Promise<string> {
  const contacts = await store.getContacts();
  const tiers: Record<number, string> = {
    1: "Tier 1 — Closest allies",
    2: "Tier 2 — Active partners",
    3: "Tier 3 — Strategic targets",
  };
  const tone: Record<number, "gold" | "teal" | "amber"> = { 1: "gold", 2: "teal", 3: "amber" };

  return `
    <section id="relationships">
      <div class="kicker">Network</div>
      <h2>Relationships</h2>
      <p class="small muted">The people who can make Tim and COL rich. Tier 1 are family. Tier 3 is who's next.</p>
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
    </section>`;
}

async function renderPress(): Promise<string> {
  const items = await store.getPress();
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
    <section id="press">
      <div class="kicker">Press</div>
      <h2>Coverage record</h2>
      ${t1.length ? `<h3 class="mt-3">Tier 1 — Global trade & mainstream</h3><div style="display:flex; flex-direction:column; gap:10px;">${t1.map((p) => renderItem(p, "accent-gold")).join("")}</div>` : ""}
      ${t2.length ? `<h3 class="mt-3">Tier 2 — Trade & specialist</h3><div style="display:flex; flex-direction:column; gap:10px;">${t2.map((p) => renderItem(p, "")).join("")}</div>` : ""}
    </section>`;
}

async function renderHeroStats(): Promise<string> {
  const [awards, speaking, news, drafts, contacts] = await Promise.all([
    store.getAwards(),
    store.getSpeaking(),
    store.getIntelligence(),
    store.getContent(),
    store.getContacts(),
  ]);

  const urgent = awards.filter((a) => a.priority === "urgent" && ["identified", "drafted"].includes(a.status)).length;
  const upcoming = speaking.filter((s) => s.startsAt && new Date(s.startsAt).getTime() >= Date.now()).length;
  const fresh = news.filter((n) => (n.relevanceScore ?? 0) >= 70).length;
  const pendingDrafts = drafts.filter((d) => d.status === "draft").length;

  return `
    <div class="grid-4 mt-3">
      <div class="stat"><div class="num">${urgent}</div><div class="lbl">Urgent award deadlines</div></div>
      <div class="stat"><div class="num">${upcoming}</div><div class="lbl">Speaking events ahead</div></div>
      <div class="stat"><div class="num">${fresh}</div><div class="lbl">High-relevance news</div><div class="sub">score ≥70</div></div>
      <div class="stat"><div class="num">${pendingDrafts}</div><div class="lbl">Drafts awaiting review</div></div>
    </div>`;
}

async function renderFocus(): Promise<string> {
  const settings = await store.getSettings();
  if (!settings.weeklyFocus && !settings.campaignGoals.thisQuarter.length) return "";
  return `
    <section id="focus">
      <div class="kicker">Voice & focus</div>
      <h2>What we're pushing on</h2>
      <div class="grid-2">
        ${
          settings.weeklyFocus
            ? `<div class="card accent-teal"><h3>This week</h3><p class="small">${esc(settings.weeklyFocus)}</p></div>`
            : ""
        }
        ${
          settings.campaignGoals.thisQuarter.length
            ? `<div class="card"><h3>This quarter</h3><ul class="list">${settings.campaignGoals.thisQuarter.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>`
            : ""
        }
      </div>
      ${
        settings.campaignGoals.twelveMonth.length
          ? `<div class="card mt-3"><h3>12-month north star</h3><ul class="list">${settings.campaignGoals.twelveMonth.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>`
          : ""
      }
    </section>`;
}

// ---------- top-level renderer ----------

export async function renderDashboard() {
  const briefs = await store.getBriefs();
  const currentWeek = mondayOf();
  const brief = briefs.find((b) => b.weekOf === currentWeek) ?? briefs[0];

  const runs = await store.getRuns();
  const lastRun = runs[0];

  const briefHtml = brief ? renderBrief(brief) : renderEmptyBrief();
  const heroStats = await renderHeroStats();

  const sections = [
    heroStats,
    briefHtml,
    await renderFocus(),
    await renderOpportunities(),
    await renderIntelligence(),
    await renderContent(),
    await renderRelationships(),
    await renderPress(),
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Tim OS — Vertical Entertainment Intelligence</title>
<style>${STYLES}</style>
</head>
<body>
<div class="layout">
  <aside>
    <div class="brand">Tim OS</div>
    <h1>Vertical entertainment intelligence</h1>
    <nav>
      <a href="#brief">Brief<span>The 12 outputs</span></a>
      <a href="#top-opps">Top opportunities<span>What to act on</span></a>
      <a href="#top-people">Top people<span>Who to know</span></a>
      <a href="#angles">Angles<span>Media · post · comment</span></a>
      <a href="#signals">Signals<span>Trend · ignore · risk</span></a>
      <a href="#focus">Voice & focus<span>This week / quarter</span></a>
      <a href="#opportunities">Pipeline<span>Awards · speaking · media</span></a>
      <a href="#intelligence">Intelligence<span>Industry feed</span></a>
      <a href="#content">Content<span>LinkedIn drafts</span></a>
      <a href="#relationships">Relationships<span>Network</span></a>
      <a href="#press">Press<span>Coverage</span></a>
    </nav>
    <div class="footer">
      <strong>Tim Oh</strong>
      Global CMO &amp; GM, COL Group International<br>
      Singapore · linkedin.com/in/timjalvin
    </div>
  </aside>
  <main>
    ${sections}
    <footer class="updated">
      <span>Generated ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC</span>
      ${
        lastRun
          ? `<span>Last agent: ${esc(lastRun.agent)} (${esc(lastRun.status)})${lastRun.status === "low-value" && lastRun.lowValueReason ? ` — ${esc(lastRun.lowValueReason)}` : ""}</span>`
          : `<span>No agent runs yet</span>`
      }
    </footer>
  </main>
</div>
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
