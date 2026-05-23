/**
 * Tim OS — JSON file store.
 *
 * Everything lives in /data/state as JSON. Versioned in git, so every routine
 * run is auditable: `git log data/state/briefs.json` shows the brief history.
 * `git diff` shows what the AI changed.
 *
 * No locking, no migrations. If two routines write at once, last write wins —
 * fine because the routine runs serially.
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, "..", "..");
export const STATE_DIR = path.join(REPO_ROOT, "data", "state");
export const DOCS_DIR = path.join(REPO_ROOT, "docs");

// ---------- shape definitions ----------

export type Settings = {
  weeklyFocus: string;
  voiceTuning: string;
  campaignGoals: { twelveMonth: string[]; thisQuarter: string[] };
  updatedAt: string;
};

export type Contact = {
  id: string;
  name: string;
  role?: string;
  company?: string;
  tier: number;
  category: string;
  notes?: string;
  strategicValue?: string;
};

export type Award = {
  id: string;
  name: string;
  organizer?: string;
  category?: string;
  url?: string;
  deadline?: string;
  ceremonyAt?: string;
  feeUsd?: number;
  priority: "urgent" | "high" | "medium" | "low";
  status: "identified" | "drafted" | "submitted" | "shortlisted" | "won" | "lost";
  fitScore?: number;
  fitRationale?: string;
  notes?: string;
};

export type SpeakingEvent = {
  id: string;
  name: string;
  organizer?: string;
  location?: string;
  url?: string;
  startsAt?: string;
  endsAt?: string;
  cfpDeadline?: string;
  role?: string;
  status: "identified" | "applied" | "confirmed" | "done" | "declined";
  fitScore?: number;
  fitRationale?: string;
  notes?: string;
};

export type MediaTarget = {
  id: string;
  outlet: string;
  journalist?: string;
  contact?: string;
  tier: number;
  beat?: string;
  pitchAngle?: string;
  status: "identified" | "pitched" | "responded" | "published" | "declined";
  notes?: string;
};

export type PressItem = {
  id: string;
  outlet: string;
  title: string;
  url?: string;
  publishedAt?: string;
  type: "article" | "podcast" | "video" | "quote";
  tier: number;
  summary?: string;
};

export type IndustryItem = {
  id: string;
  source: string;
  sourceUrl?: string;
  title: string;
  url: string;
  publishedAt?: string;
  rawSummary?: string;
  aiSummary?: string;
  topics?: string[];
  relevanceScore?: number;
  hook?: string;
  status: "new" | "reviewed" | "acted" | "dismissed";
  createdAt: string;
};

export type ContentIdea = {
  id: string;
  platform: "linkedin" | "x" | "newsletter" | "podcast-pitch";
  format: "post" | "article" | "thread" | "newsletter" | "reply";
  hook: string;
  body: string;
  rationale?: string;
  predictedEngagement?: "low" | "medium" | "high";
  sourceItemId?: string;
  status: "draft" | "approved" | "scheduled" | "posted" | "dismissed";
  scheduledFor?: string;
  postedAt?: string;
  notes?: string;
  createdAt: string;
};

export type Brief = {
  id: string;
  weekOf: string;
  headline: string;
  industryDigest: string;
  topActions: Array<{ title: string; why: string; deadline?: string }>;
  contentToPost: Array<{ hook: string; angle: string; predictedEngagement: string }>;
  relationshipMoves: Array<{ person: string; move: string; why: string }>;
  opportunityFocus: { name: string; why: string; nextStep: string };
  model: string;
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number };
  createdAt: string;
};

export type AgentRun = {
  id: string;
  agent: string;
  status: "success" | "failure";
  startedAt: string;
  finishedAt: string;
  itemsCreated: number;
  itemsUpdated: number;
  errorMessage?: string;
  metadata?: string;
};

// ---------- generic JSON I/O ----------

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(path.join(STATE_DIR, file), "utf-8");
    return JSON.parse(buf) as T;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "ENOENT") return fallback;
    throw e;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await fs.mkdir(STATE_DIR, { recursive: true });
  await fs.writeFile(
    path.join(STATE_DIR, file),
    JSON.stringify(data, null, 2) + "\n",
    "utf-8"
  );
}

// ---------- typed accessors ----------

export const store = {
  // settings
  getSettings: () =>
    readJson<Settings>("settings.json", {
      weeklyFocus: "",
      voiceTuning: "",
      campaignGoals: { twelveMonth: [], thisQuarter: [] },
      updatedAt: new Date().toISOString(),
    }),
  setSettings: (s: Settings) => writeJson("settings.json", s),

  // contacts
  getContacts: () => readJson<Contact[]>("contacts.json", []),
  setContacts: (xs: Contact[]) => writeJson("contacts.json", xs),

  // awards
  getAwards: () => readJson<Award[]>("awards.json", []),
  setAwards: (xs: Award[]) => writeJson("awards.json", xs),

  // speaking
  getSpeaking: () => readJson<SpeakingEvent[]>("speaking.json", []),
  setSpeaking: (xs: SpeakingEvent[]) => writeJson("speaking.json", xs),

  // media
  getMedia: () => readJson<MediaTarget[]>("media.json", []),
  setMedia: (xs: MediaTarget[]) => writeJson("media.json", xs),

  // press
  getPress: () => readJson<PressItem[]>("press.json", []),
  setPress: (xs: PressItem[]) => writeJson("press.json", xs),

  // intelligence
  getIntelligence: () => readJson<IndustryItem[]>("intelligence.json", []),
  setIntelligence: (xs: IndustryItem[]) => writeJson("intelligence.json", xs),

  // content
  getContent: () => readJson<ContentIdea[]>("content.json", []),
  setContent: (xs: ContentIdea[]) => writeJson("content.json", xs),

  // briefs (array, latest first)
  getBriefs: () => readJson<Brief[]>("briefs.json", []),
  setBriefs: (xs: Brief[]) => writeJson("briefs.json", xs),
  upsertBrief: async (b: Brief) => {
    const all = await store.getBriefs();
    const without = all.filter((x) => x.weekOf !== b.weekOf);
    await store.setBriefs([b, ...without]);
  },

  // runs (capped at 200 most recent)
  getRuns: () => readJson<AgentRun[]>("runs.json", []),
  appendRun: async (r: AgentRun) => {
    const all = await store.getRuns();
    all.unshift(r);
    await writeJson("runs.json", all.slice(0, 200));
  },
};

// ---------- helpers ----------

export function nowIso() {
  return new Date().toISOString();
}

export function cuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
