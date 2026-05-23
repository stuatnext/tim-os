export type SeedPress = {
  outlet: string;
  title: string;
  url?: string;
  publishedAt?: Date;
  type: string;
  tier: number;
  summary?: string;
};

const d = (s: string) => new Date(s);

export const SEED_PRESS: SeedPress[] = [
  // ===== Tier 1 =====
  {
    outlet: "Variety",
    title: "FlareFlow launches Vertical Drama Love Fan Awards in LA",
    type: "article",
    tier: 1,
    summary: "Exclusive: Inaugural LA awards. Sponsors include BuzzFeed, halogen.cinema, Eris Talent Agency.",
  },
  {
    outlet: "Variety",
    title: "COL Group's distribution network expands to 1,700+ titles",
    type: "article",
    tier: 1,
    summary: "Exclusive on Tim's distribution build-out across 10+ territories.",
  },
  {
    outlet: "Variety",
    title: "SupermodelMe goes vertical — first reality TV adaptation in micro-drama",
    type: "article",
    tier: 1,
    summary: "Exclusive on Tim's deal with Refinery Media.",
  },
  {
    outlet: "Variety",
    title: "From Rags to Rank One sequel greenlit",
    type: "article",
    tier: 1,
    summary: "One of the first microdrama franchises to be developed as serialised IP.",
  },
  {
    outlet: "Deadline",
    title: "Microdrama in a Box: COL Group and BeLive Technology launch turnkey SaaS",
    type: "article",
    tier: 1,
    publishedAt: d("2026-03-18"),
    summary: "Launch SaaS — any broadcaster can run a vertical platform in 30 days.",
  },
  {
    outlet: "Deadline",
    title: "COL Group inks Narativ Media MENA/CIS/Africa distribution deal",
    type: "article",
    tier: 1,
  },
  {
    outlet: "The Hollywood Reporter",
    title: "Microdrama 2026: The Global Breakout (MIP London coverage)",
    type: "article",
    tier: 1,
    publishedAt: d("2026-02-25"),
    summary: "Coverage of Tim's MIP London panel. 'I can watch this on the toilet' quote went viral.",
  },
  {
    outlet: "South China Morning Post",
    title: "How a Singaporean is building China's micro-drama bridge to the world",
    type: "article",
    tier: 1,
    summary: "Full-page feature by Lisa Cam. Tim's favourite interview to date.",
  },
  {
    outlet: "Associated Press",
    title: "The Mindset Advantage podcast feature",
    type: "podcast",
    tier: 1,
  },
  {
    outlet: "Business Insider",
    title: "The Mindset Advantage podcast coverage",
    type: "podcast",
    tier: 1,
  },

  // ===== Tier 2 =====
  {
    outlet: "TVBIZZ",
    title: "Microdrama is Not a Trend, it's a Behavioral Shift",
    type: "article",
    tier: 2,
    summary: "Yako Molhov interview. Tim's most-quoted headline.",
  },
  {
    outlet: "ContentAsia",
    title: "Tim Oh appointed Global CMO of FlareFlow",
    type: "article",
    tier: 2,
    summary: "Janine Stein broke the CMO appointment news.",
  },
  {
    outlet: "ContentAsia",
    title: "COL Group commits $45M to 180 originals in 2026",
    type: "article",
    tier: 2,
  },
  {
    outlet: "ScreenMDM",
    title: "Inside the Hengqin-Macau mega studio",
    type: "article",
    tier: 2,
    summary: "Mansha Daswani feature on COL's 220,000 sqm studio.",
  },
  {
    outlet: "MARKETECH APAC",
    title: "Tim Oh on making Singapore COL's global launchpad",
    type: "article",
    tier: 2,
  },
  {
    outlet: "Vitrina AI",
    title: "Vitrina LeaderSpeak: Timothy Oh on COL's production model",
    type: "podcast",
    tier: 2,
    summary: "Deep operational interview. Atul Phadnis. 'We test 6 versions of the same story.'",
  },
  {
    outlet: "R:ID (real-reel.com)",
    title: "Timothy Oh on Vertical Drama and Global Content Judgment",
    type: "article",
    tier: 2,
    summary: "Tim's self-described favourite interview.",
  },
  {
    outlet: "Jay & Tony Show — Vertically Challenged",
    title: "Inside the Mind of Timothy Oh: The Vertical Visionary Who Outran the Mob",
    type: "podcast",
    tier: 2,
    summary: "Apple Podcasts episode #109, 2-part series. 'Survived dinner with Taiwanese mafia.'",
  },
];
