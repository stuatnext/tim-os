/**
 * Inline CSS for the Tim OS dashboard. Self-contained — no CDNs, no fonts.
 *
 * Layout: sidebar (desktop) / sticky horizontal scrolling tab bar (mobile).
 * Each tab swaps the main panel via ~30 lines of inline JS. The default
 * tab ("This week") is the priority surface — hero + actions + drafts +
 * people. Other tabs hold the brief, pipeline, content, intelligence,
 * network, press, focus.
 */
export const STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --ink: #0F0F0E;
  --ink-soft: #2a2a26;
  --paper: #F8F6F1;
  --paper-soft: #FBFAF6;
  --accent: #1D9E75;
  --gold: #B8960C;
  --warn: #BA7517;
  --danger: #B83232;
  --line: #E8E4D9;
  --muted: #7A766A;
}
html, body {
  background: var(--paper);
  color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  min-height: 100%;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

/* ---------- LAYOUT ---------- */

.layout {
  display: grid;
  grid-template-columns: 248px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: rgba(255,255,255,0.55);
  border-right: 1px solid var(--line);
  padding: 22px 14px 18px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  display: flex; flex-direction: column;
}
.sidebar .brand-block { padding: 0 8px 14px; }
.sidebar .brand {
  font-size: 14px; font-weight: 600; letter-spacing: -0.005em;
}
.sidebar .brand-sub {
  font-size: 11px; color: var(--muted);
  letter-spacing: 0.04em; margin-top: 2px;
}
.nav-list {
  display: flex; flex-direction: column; gap: 2px;
  margin-top: 4px;
}
.nav-link {
  color: var(--ink);
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13.5px;
  display: block;
  transition: background 0.12s, color 0.12s;
  text-decoration: none;
}
.nav-link:hover { background: rgba(232,228,217,0.7); text-decoration: none; }
.nav-link.active {
  background: var(--ink);
  color: var(--paper);
}
.nav-link.active .nav-sub { color: rgba(248,246,241,0.7); }
.nav-link.active .nav-badge { background: rgba(248,246,241,0.18); color: var(--paper); }
.nav-row {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.nav-title { font-weight: 500; }
.nav-badge {
  font-size: 10.5px;
  background: rgba(232,228,217,0.85);
  color: var(--ink-soft);
  padding: 1px 7px;
  border-radius: 10px;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.nav-sub {
  display: block;
  font-size: 11.5px;
  color: var(--muted);
  margin-top: 2px;
}

.sidebar-foot {
  margin-top: auto;
  padding: 14px 8px 0;
  border-top: 1px solid var(--line);
  font-size: 11px;
  color: var(--muted);
  line-height: 1.6;
}
.sidebar-foot strong { color: var(--ink); display: block; font-size: 12px; }

.main {
  padding: 32px 40px 48px;
  max-width: 1080px;
  width: 100%;
}

/* ---------- PANELS (tabbed) ---------- */

.panel { display: none; }
.panel.active { display: block; animation: fade .14s ease; }
@keyframes fade { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }

.week-section { margin-top: 4px; }

/* ---------- HERO ---------- */

.hero {
  padding: 4px 0 24px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 28px;
}
.hero .kicker {
  font-size: 11px; letter-spacing: 0.15em;
  color: var(--muted); text-transform: uppercase; font-weight: 500;
}
.hero-headline {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: -0.01em;
  margin: 10px 0 14px;
  max-width: 880px;
}
.hero-sub {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ink-soft);
  max-width: 880px;
  margin-bottom: 16px;
}
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: var(--paper-soft);
  border: 1px solid var(--line);
  border-radius: 20px;
  font-size: 12.5px;
  color: var(--ink-soft);
}
.chip strong { color: var(--ink); font-weight: 600; }
.chip-red { border-color: rgba(184,50,50,0.35); background: rgba(184,50,50,0.06); }
.chip-red strong { color: var(--danger); }
.chip-teal { border-color: rgba(29,158,117,0.35); background: rgba(29,158,117,0.06); }
.chip-teal strong { color: var(--accent); }
.chip-gold { border-color: rgba(184,150,12,0.35); background: rgba(184,150,12,0.06); }
.chip-gold strong { color: var(--gold); }

/* ---------- SECTION HEADINGS ---------- */

.section-h {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 12px; margin-bottom: 14px;
}
.section-h h2 {
  font-size: 19px; font-weight: 600; letter-spacing: -0.005em;
  line-height: 1.2;
}
.mt-5 { margin-top: 36px; }

/* ---------- ACT ON THIS WEEK ---------- */

.action-headline {
  background: var(--ink);
  color: var(--paper);
  border: none;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 14px;
}
.action-headline .action-pill-row { margin-bottom: 6px; }
.action-headline .action-title {
  color: var(--paper);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.45;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.action-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex; flex-direction: column;
  box-shadow: 0 1px 0 rgba(15,15,14,0.04);
}
.action-card:hover { border-color: rgba(15,15,14,0.18); }
.action-pill-row {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  margin-bottom: 8px;
}
.action-rank {
  margin-left: auto;
  font-size: 11px; color: var(--muted);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}
.action-title {
  font-size: 15px; font-weight: 600; line-height: 1.35;
  color: var(--ink);
  margin-bottom: 6px;
}
.action-move {
  font-size: 13.5px; line-height: 1.55;
  color: var(--ink-soft);
}
.action-context {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--line);
}
.action-source {
  margin-top: 8px;
  color: var(--muted);
  align-self: flex-start;
}
.action-source:hover { color: var(--accent); }

/* ---------- DRAFTS ---------- */

.draft-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.draft-card {
  background: #fff;
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: 10px;
  padding: 14px 16px;
}
.draft-hook {
  font-size: 15px; font-weight: 600; line-height: 1.4;
  color: var(--ink);
  margin: 4px 0 8px;
}
details.draft-body {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
}
details.draft-body summary {
  cursor: pointer;
  font-size: 12.5px;
  color: var(--muted);
  list-style: none;
  user-select: none;
}
details.draft-body summary::-webkit-details-marker { display: none; }
details.draft-body summary::before { content: "▸ "; font-size: 10px; }
details.draft-body[open] summary::before { content: "▾ "; }
details.draft-body summary:hover { color: var(--accent); }
details.draft-body pre {
  font-family: inherit;
  font-size: 13px; line-height: 1.55;
  background: rgba(232,228,217,0.3);
  padding: 12px 14px;
  border-radius: 6px;
  white-space: pre-wrap;
  margin-top: 10px;
}

/* ---------- PEOPLE ---------- */

.people-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.person-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px;
}
.person-card.priority-high { border-left: 3px solid var(--danger); }
.person-card.priority-medium { border-left: 3px solid var(--accent); }
.person-card.priority-low { border-left: 3px solid var(--line); }
.person-name { font-size: 14.5px; font-weight: 600; }

/* ---------- GENERIC CARDS / GRIDS ---------- */

.card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 0 rgba(15,15,14,0.04);
}
.card.accent-gold { border-left: 3px solid var(--gold); }
.card.accent-teal { border-left: 3px solid var(--accent); }
.card.accent-amber { border-left: 3px solid var(--warn); }
.card.accent-red { border-left: 3px solid var(--danger); }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

.pill {
  display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px;
  font-size: 11px; font-weight: 500; line-height: 1.4;
}
.pill-gray { background: rgba(232,228,217,0.6); color: rgba(15,15,14,0.7); }
.pill-teal { background: rgba(29,158,117,0.15); color: var(--accent); }
.pill-gold { background: rgba(184,150,12,0.15); color: var(--gold); }
.pill-amber { background: rgba(186,117,23,0.15); color: var(--warn); }
.pill-red { background: rgba(184,50,50,0.15); color: var(--danger); }
.pill-ink { background: var(--ink); color: var(--paper); }

.list { list-style: none; }
.list li { padding: 6px 0; border-bottom: 1px solid rgba(232,228,217,0.7); font-size: 13.5px; }
.list li:last-child { border-bottom: none; }

.brief-body { font-size: 14px; line-height: 1.7; color: rgba(15,15,14,0.85); white-space: pre-wrap; }

.row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.tag-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }

.score-bar { height: 4px; background: rgba(232,228,217,0.6); border-radius: 2px; overflow: hidden; margin-top: 6px; }
.score-bar > div { height: 100%; background: var(--accent); }

.opps { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.opp { position: relative; }
.opp-num { position: absolute; top: 14px; right: 18px; font-size: 11px; color: var(--muted); letter-spacing: 0.1em; }
.opp-title { font-size: 14.5px; font-weight: 600; margin-top: 2px; }

.score-grid {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;
  margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line);
}
.score-cell { background: rgba(232,228,217,0.4); border-radius: 5px; padding: 6px 8px; text-align: center; }
.score-k { font-size: 9.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
.score-v { font-size: 16px; font-weight: 600; margin-top: 2px; }
.score-v.risk-high { color: var(--danger); }

pre.comment-draft {
  font-family: inherit; font-size: 13px; line-height: 1.5;
  background: rgba(232,228,217,0.3); padding: 10px 12px;
  border-radius: 5px; margin-top: 8px; white-space: pre-wrap;
}

.hook { font-weight: 600; font-size: 14.5px; line-height: 1.35; }
.title { font-weight: 500; }
.kicker { font-size: 11px; letter-spacing: 0.15em; color: var(--muted); text-transform: uppercase; font-weight: 500; }
h3 { font-size: 13.5px; font-weight: 600; margin-bottom: 8px; }

.muted { color: var(--muted); }
.small { font-size: 12.5px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }

/* ---------- EMPTY STATE ---------- */

.empty-state {
  background: var(--paper-soft);
  border: 1px dashed var(--line);
  border-radius: 10px;
  padding: 22px 24px;
}
.empty-state-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 8px;
}

/* ---------- FOOTER ---------- */

.page-footer {
  margin-top: 48px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  flex-wrap: wrap;
}
.footer-run {
  display: inline-flex; align-items: center; gap: 8px;
  flex-wrap: wrap;
}
.footer-run-agent {
  font-weight: 500; color: var(--ink-soft);
  font-feature-settings: "tnum";
}
.footer-why {
  display: inline-block;
}
.footer-why summary {
  cursor: pointer;
  list-style: none;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
  user-select: none;
}
.footer-why summary::-webkit-details-marker { display: none; }
.footer-why summary:hover { color: var(--accent); }
.footer-why[open] {
  display: block;
  margin-top: 8px;
  flex-basis: 100%;
}
.footer-why[open] p {
  margin-top: 6px;
  padding: 10px 12px;
  background: rgba(186,117,23,0.06);
  border-left: 3px solid rgba(186,117,23,0.4);
  border-radius: 6px;
  color: var(--ink-soft);
  line-height: 1.55;
}

/* ---------- MOBILE — sidebar becomes a sticky horizontal tab bar ---------- */

@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar {
    position: sticky; top: 0; height: auto; max-height: none;
    overflow-x: auto; overflow-y: hidden;
    padding: 10px 14px;
    background: var(--paper);
    border-right: none;
    border-bottom: 1px solid var(--line);
    z-index: 20;
    display: block;
    -webkit-overflow-scrolling: touch;
  }
  .sidebar .brand-block { display: none; }
  .sidebar-foot { display: none; }
  .nav-list {
    display: flex; flex-direction: row; gap: 6px; flex-wrap: nowrap;
    margin-top: 0;
  }
  .nav-link {
    flex-shrink: 0;
    padding: 8px 14px;
    border: 1px solid var(--line);
    background: #fff;
    border-radius: 999px;
    font-size: 13px;
    white-space: nowrap;
  }
  .nav-link.active { border-color: var(--ink); }
  .nav-row { gap: 6px; }
  .nav-sub { display: none; }
  .main { padding: 20px 16px 32px; max-width: none; }
  .hero-headline { font-size: 24px; }
  .hero-sub { font-size: 13.5px; }
  .action-grid, .draft-grid, .people-grid, .grid-2, .grid-3, .opps {
    grid-template-columns: 1fr;
  }
  .page-footer { flex-direction: column; gap: 8px; }
}

/* ---------- ULTRA-WIDE — keep content readable ---------- */

@media (min-width: 1400px) {
  .main { max-width: 1180px; }
}
`.trim();
