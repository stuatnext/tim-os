/**
 * Inline CSS for the Tim OS dashboard. Tim opens index.html — no external
 * fonts, no CDNs, everything self-contained so it renders the same forever.
 */
export const STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --ink: #0F0F0E;
  --paper: #F8F6F1;
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
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

.layout { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }

aside {
  background: rgba(255,255,255,0.45);
  border-right: 1px solid var(--line);
  padding: 24px 18px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}
aside .brand {
  font-size: 11px; letter-spacing: 0.15em; color: var(--muted); text-transform: uppercase;
}
aside h1 {
  font-size: 17px; font-weight: 600; margin: 4px 0 24px; line-height: 1.25;
}
aside nav { display: flex; flex-direction: column; gap: 2px; }
aside nav a {
  color: var(--ink); padding: 8px 10px; border-radius: 6px; font-size: 13.5px;
  display: block; transition: background 0.12s;
}
aside nav a:hover { background: rgba(232,228,217,0.7); text-decoration: none; }
aside nav a span { display: block; font-size: 11px; color: var(--muted); margin-top: 1px; }
aside .footer {
  margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--line);
  font-size: 11px; color: var(--muted); line-height: 1.6;
}
aside .footer strong { color: var(--ink); display: block; }

main { padding: 40px 48px; max-width: 1080px; }
section { margin-bottom: 56px; scroll-margin-top: 20px; }
section.hero { margin-bottom: 40px; padding-bottom: 28px; border-bottom: 1px solid var(--line); }

.kicker { font-size: 11px; letter-spacing: 0.15em; color: var(--muted); text-transform: uppercase; font-weight: 500; }
h2 { font-size: 24px; font-weight: 600; margin: 8px 0 18px; line-height: 1.2; }
h3 { font-size: 14px; font-weight: 600; margin-bottom: 10px; }

.headline { font-size: 30px; font-weight: 600; line-height: 1.2; margin: 6px 0 18px; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

.card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: 0 1px 0 rgba(15,15,14,0.04), 0 1px 2px rgba(15,15,14,0.04);
}
.card.accent-gold { border-left: 3px solid var(--gold); }
.card.accent-teal { border-left: 3px solid var(--accent); }
.card.accent-amber { border-left: 3px solid var(--warn); }
.card.accent-red { border-left: 3px solid var(--danger); }

.stat {
  background: rgba(232,228,217,0.4);
  border-radius: 8px;
  padding: 14px 16px;
}
.stat .num { font-size: 24px; font-weight: 600; line-height: 1; }
.stat .lbl { font-size: 11.5px; color: var(--muted); margin-top: 6px; }
.stat .sub { font-size: 10.5px; color: var(--muted); margin-top: 3px; }

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
.list li { padding: 8px 0; border-bottom: 1px solid rgba(232,228,217,0.7); font-size: 13.5px; }
.list li:last-child { border-bottom: none; }
.list li .title { font-weight: 500; }
.list li .sub { font-size: 12px; color: var(--muted); margin-top: 2px; }

ol.actions { list-style: none; counter-reset: action; }
ol.actions li { counter-increment: action; padding: 10px 0; border-bottom: 1px solid rgba(232,228,217,0.7); font-size: 13.5px; }
ol.actions li:last-child { border-bottom: none; }
ol.actions li::before {
  content: counter(action);
  display: inline-block; width: 22px; height: 22px; line-height: 22px;
  border-radius: 50%; background: var(--ink); color: var(--paper);
  text-align: center; font-size: 11px; margin-right: 10px;
}
ol.actions .why { font-size: 12px; color: var(--muted); margin-top: 4px; margin-left: 32px; }

.brief-body { font-size: 14px; line-height: 1.7; color: rgba(15,15,14,0.85); white-space: pre-wrap; }

.draft pre {
  font-family: inherit;
  font-size: 13.5px; line-height: 1.6;
  background: rgba(232,228,217,0.3);
  padding: 14px 16px;
  border-radius: 6px;
  white-space: pre-wrap;
  margin-top: 8px;
}
.draft .hook { font-weight: 600; font-size: 14.5px; }
.draft .meta { font-size: 11.5px; color: var(--muted); margin-top: 8px; font-style: italic; }

.row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.tag-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }

.score-bar { height: 4px; background: rgba(232,228,217,0.6); border-radius: 2px; overflow: hidden; margin-top: 6px; }
.score-bar > div { height: 100%; background: var(--accent); }

.muted { color: var(--muted); }
.small { font-size: 12px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }

footer.updated {
  margin-top: 56px; padding-top: 18px; border-top: 1px solid var(--line);
  font-size: 11px; color: var(--muted); display: flex; justify-content: space-between;
}

@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; }
  aside { position: static; height: auto; }
  main { padding: 24px 20px; }
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
}
`.trim();
