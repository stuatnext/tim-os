/**
 * Tim OS — HTML renderer.
 *
 * Reads every state file from data/state/*.json and emits a single static
 * docs/index.html that GitHub Pages serves. Self-contained: inline CSS,
 * no external dependencies, no JS framework. Renders identically forever.
 */
import { promises as fs } from "fs";
import path from "path";
import { DOCS_DIR, store, mondayOf, type Brief, type IndustryItem } from "../lib/store";
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

// ---------- section renderers ----------

function renderBrief(brief: Brief | undefined): string {
  if (!brief) {
    return `
      <section class="hero" id="brief">
        <div class="kicker">Brief</div>
        <div class="headline">Run the routine to generate this week's brief.</div>
        <p class="muted small">Once the Claude Code routine runs on Sunday night, Opus will synthesise the last 14 days of intelligence into a Monday-morning plan: industry digest, top actions, content suggestions, relationship moves, and the single opportunity to focus on.</p>
      </section>`;
  }

  return `
    <section class="hero" id="brief">
      <div class="kicker">Brief · week of ${date(brief.weekOf)}</div>
      <div class="headline">${esc(brief.headline)}</div>

      <div class="grid-2 mt-3">
        <div class="card accent-gold">
          <h3>Industry digest</h3>
          <div class="brief-body">${esc(brief.industryDigest)}</div>
        </div>
        <div class="card accent-amber">
          <h3>This week's one thing</h3>
          <div><strong>${esc(brief.opportunityFocus.name)}</strong></div>
          <p class="small mt-2">${esc(brief.opportunityFocus.why)}</p>
          <div class="mt-3 small"><span class="kicker">Next step</span><br><strong>${esc(brief.opportunityFocus.nextStep)}</strong></div>
        </div>
      </div>

      <div class="grid-2 mt-3">
        <div class="card accent-teal">
          <h3>Top actions</h3>
          <ol class="actions">
            ${brief.topActions
              .map(
                (a) =>
                  `<li><span class="title">${esc(a.title)}</span>${a.deadline ? ` ${pill(`by ${date(a.deadline)}`, "amber")}` : ""}<div class="why">${esc(a.why)}</div></li>`
              )
              .join("")}
          </ol>
        </div>
        <div class="card">
          <h3>Relationships to engage</h3>
          <ul class="list">
            ${brief.relationshipMoves
              .map(
                (r) =>
                  `<li><span class="title">${esc(r.person)}</span><div class="sub">${esc(r.move)}</div><div class="sub muted">${esc(r.why)}</div></li>`
              )
              .join("")}
          </ul>
        </div>
      </div>

      <div class="card mt-3">
        <h3>Content the AI suggests this week</h3>
        <ul class="list">
          ${brief.contentToPost
            .map(
              (c) =>
                `<li><div class="row"><span class="title">"${esc(c.hook)}"</span>${pill(`predicted ${c.predictedEngagement}`, c.predictedEngagement === "high" ? "teal" : "gray")}</div><div class="sub">${esc(c.angle)}</div></li>`
            )
            .join("")}
        </ul>
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
      <div class="kicker">Opportunities</div>
      <h2>Pipeline</h2>

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
              ${s.notes ? `<p class="small muted mt-2">${esc(s.notes)}</p>` : ""}
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
    .slice(0, 30);

  if (sorted.length === 0) {
    return `
      <section id="intelligence">
        <div class="kicker">Intelligence</div>
        <h2>Industry feed</h2>
        <div class="card">
          <p class="small muted">No items yet. The feed-refresh routine pulls from Variety, Deadline, THR, Campaign Asia and others, filtered to Tim's beat. The summariser then scores each one 0–100 for relevance.</p>
        </div>
      </section>`;
  }

  return `
    <section id="intelligence">
      <div class="kicker">Intelligence</div>
      <h2>Industry feed</h2>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${sorted.map((it: IndustryItem) => `
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
            ${it.hook ? `<div class="small mt-2" style="border-left:2px solid rgba(29,158,117,0.4); padding-left:10px; color:var(--accent); font-style:italic;">Angle: ${esc(it.hook)}</div>` : ""}
          </div>`).join("")}
      </div>
    </section>`;
}

async function renderContent(): Promise<string> {
  const all = await store.getContent();
  const drafts = all.slice(0, 15);

  if (drafts.length === 0) {
    return `
      <section id="content">
        <div class="kicker">Content</div>
        <h2>LinkedIn drafts</h2>
        <div class="card">
          <p class="small muted">No drafts yet. The content agent generates 3 drafts at a time in Tim's voice — data-led, contrarian, vulnerability+anchor — using the cached voice bank.</p>
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
              <div class="hook mt-2">"${esc(d.hook)}"</div>
              <pre>${esc(d.body)}</pre>
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
      <div class="kicker">Relationships</div>
      <h2>Network</h2>
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

async function renderHero(brief: Brief | undefined): Promise<string> {
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
  const tier1 = contacts.filter((c) => c.tier === 1).length;

  return `
    <div class="grid-4 mt-3">
      <div class="stat"><div class="num">${urgent}</div><div class="lbl">Urgent award deadlines</div></div>
      <div class="stat"><div class="num">${upcoming}</div><div class="lbl">Speaking events ahead</div></div>
      <div class="stat"><div class="num">${fresh}</div><div class="lbl">High-relevance news</div><div class="sub">score ≥70</div></div>
      <div class="stat"><div class="num">${pendingDrafts}</div><div class="lbl">Drafts awaiting review</div></div>
    </div>
    ${renderBrief(brief)}`;
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

  const sections = [
    await renderHero(brief),
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
      <a href="#brief">Brief<span>Monday morning</span></a>
      <a href="#focus">Voice & focus<span>This week / quarter</span></a>
      <a href="#opportunities">Opportunities<span>Awards · speaking · media</span></a>
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
          ? `<span>Last agent: ${esc(lastRun.agent)} (${esc(lastRun.status)})</span>`
          : `<span>No agent runs yet</span>`
      }
    </footer>
  </main>
</div>
</body>
</html>
`;

  await fs.mkdir(DOCS_DIR, { recursive: true });
  await fs.writeFile(path.join(DOCS_DIR, "index.html"), html, "utf-8");
  return { bytes: html.length };
}
