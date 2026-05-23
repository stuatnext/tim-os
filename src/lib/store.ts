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
export const ROOT_DIR = REPO_ROOT;

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

export type ScoreAxes = {
  timAuthorityFit: number;       // 1-5: plays to Tim's expertise
  colCommercialUpside: number;   // 1-5: moves the business
  microdramaRelevance: number;   // 1-5: touches core category
  mediaCoveragePotential: number; // 1-5: will generate visibility
  relationshipValue: number;     // 1-5: builds the network
  personalityFit: number;        // 1-5: feels like Tim
  timeliness: number;            // 1-5: window open now
  evidenceStrength: number;      // 1-5: signal is real
  easeOfAction: number;          // 1-5: low friction
  reputationRisk: number;        // 1-5: HIGH means risky
};

export type Action =
  | "Act now"
  | "Pitch"
  | "Post"
  | "Comment"
  | "DM"
  | "Watch"
  | "Park"
  | "Ignore";

export type Opportunity = {
  title: string;
  type: string;             // "podcast guest", "panel", "comment", "DM", "investor narrative", etc.
  why: string;              // 1-2 sentences. Why now, why Tim.
  source?: string;          // URL or named reference. Required for public claims.
  dateChecked?: string;     // ISO. Required when citing market claims.
  scores: ScoreAxes;
  action: Action;
  evidence: "strong" | "moderate" | "weak";
};

export type RelationshipTarget = {
  name: string;
  role?: string;
  organisation?: string;
  whyMatters: string;
  source?: string;
  timRelevance: string;
  colRelevance: string;
  bestApproach: string;       // free text
  publicMove?: string;        // a public engagement option (comment, repost, tag)
  privateMove?: string;       // a private outreach option (DM, intro request)
  risk?: string;
  priority: "high" | "medium" | "low";
};

export type ContentIdea = {
  id: string;
  platform: "linkedin" | "x" | "newsletter" | "podcast-pitch";
  format:
    | "post"
    | "article"
    | "thread"
    | "newsletter"
    | "reply"
    | "comment"
    | "piece-to-camera"
    | "vlog"
    | "bts"
    | "reaction"
    | "photo-caption"
    | "livestream";
  title: string;             // headline-style internal label
  hook: string;              // opening line under 14 words
  coreArgument: string;      // the central claim in one sentence
  whyNow: string;            // time peg
  sourceEvidence: string;    // links + receipts
  timPOV: string;            // Tim's specific take
  colRelevance: string;      // how this serves COL
  supportingPoints: string[]; // 2-5 bullets
  risk?: string;             // what could go wrong (Tim or COL)
  body: string;              // full draft text
  rationale?: string;        // why this works for Tim
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
  headline: string;          // one-line strategic priority
  whatChanged: string;       // 1. since last run — paragraph
  topOpportunities: Opportunity[];  // 2. top 5
  topPeople: RelationshipTarget[];  // 3. top 5
  bestMediaAngle: {                 // 4
    angle: string;
    targetOutlet?: string;
    why: string;
    evidence: string;
  };
  bestLinkedInAngle: {              // 5
    hook: string;
    angle: string;
    why: string;
  };
  bestCommentOpportunity: {         // 6
    targetPostUrl?: string;
    targetAuthor: string;
    suggestedComment: string;
    why: string;
    risk: string;
  };
  bestRelationshipMove: RelationshipTarget; // 7
  bestColOpportunity: {             // 8
    title: string;
    why: string;
    commercialUpside: string;
    nextStep: string;
  };
  risingTrend: {                    // 9
    trend: string;
    evidence: string;
    implication: string;
  };
  thingToIgnore: {                  // 10
    item: string;
    why: string;
  };
  reputationRisk: {                 // 11
    risk: string;
    mitigation: string;
  };
  suggestedAction: {                // 12
    for: "Stuart" | "Tim";
    action: string;
    urgency: "this-week" | "this-month" | "this-quarter";
  };
  model: string;
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number };
  createdAt: string;
};

export type AgentRun = {
  id: string;
  agent: string;
  status: "success" | "failure" | "low-value";
  startedAt: string;
  finishedAt: string;
  itemsCreated: number;
  itemsUpdated: number;
  errorMessage?: string;
  lowValueReason?: string;
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
