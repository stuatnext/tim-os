export type SeedAward = {
  name: string;
  organizer?: string;
  category?: string;
  url?: string;
  deadline?: Date;
  ceremonyAt?: Date;
  feeUsd?: number;
  priority: string;
  status: string;
  fitScore?: number;
  fitRationale?: string;
  notes?: string;
};

const d = (s: string) => new Date(s);

export const SEED_AWARDS: SeedAward[] = [
  {
    name: "StreamTV Awards — Content Partnerships Executive of the Year",
    organizer: "StreamTV",
    category: "Content Partnerships Executive",
    deadline: d("2026-06-15"),
    ceremonyAt: d("2026-06-17"),
    priority: "urgent",
    status: "identified",
    fitScore: 95,
    fitRationale: "Best category match for Tim's exact role: 1,700+ titles distributed, USD 1M+ B2B revenue, Microdrama in a Box.",
  },
  {
    name: "Campaign Asia 40 Under 40",
    organizer: "Campaign Asia-Pacific",
    category: "40 Under 40",
    deadline: d("2026-06-30"),
    priority: "urgent",
    status: "identified",
    fitScore: 92,
    fitRationale: "Tim just turned 40 — verify eligibility window. If eligible, his single best personal profile award.",
    notes: "Verify birth year first. Campaign Asia is a key Tim media relationship.",
  },
  {
    name: "Campaign Asia Media Awards — Media Leader of the Year",
    organizer: "Campaign Asia-Pacific",
    category: "Media Leader of the Year",
    deadline: d("2026-07-14"),
    priority: "high",
    status: "identified",
    fitScore: 90,
    fitRationale: "Strong category fit. Tim's COL Group earned-media campaign is a perfect case study.",
  },
  {
    name: "Cannes Lions — Entertainment / Innovation",
    organizer: "Cannes Lions",
    category: "Innovation Lion / Creative Business Transformation",
    feeUsd: 1200,
    priority: "high",
    status: "identified",
    fitScore: 78,
    fitRationale: "Microdrama in a Box and the distribution network fit Innovation Lion or Creative Business Transformation.",
  },
  {
    name: "AACA Best Micro-Drama",
    organizer: "Asian Academy Creative Awards",
    deadline: d("2026-08-01"),
    ceremonyAt: d("2026-12-03"),
    feeUsd: 299,
    priority: "high",
    status: "identified",
    fitScore: 88,
    fitRationale: "World's first dedicated micro-drama award. Tim's home event (Singapore). Submit top 3-5 titles.",
  },
  {
    name: "The Drum Awards APAC",
    organizer: "The Drum",
    ceremonyAt: d("2026-05-21"),
    priority: "high",
    status: "identified",
    fitScore: 75,
    fitRationale: "Singapore ceremony — Tim's home market. Best Content Marketing or Entertainment Marketing.",
  },
  {
    name: "TEDxSingapore Nomination",
    organizer: "TEDxSingapore",
    priority: "high",
    status: "identified",
    fitScore: 80,
    fitRationale: "Self-nomination accepted year-round. Talk concept: 'The 90-Second Story.' Picked up by TED.com = global visibility.",
  },
  {
    name: "ACES — Asia's Most Inspiring Executives",
    organizer: "ACES",
    priority: "medium",
    status: "identified",
    fitScore: 70,
    fitRationale: "Self-nomination open now. Ceremony in November.",
  },
  {
    name: "MARKETING-INTERACTIVE Marketing Excellence Awards SG",
    organizer: "MARKETING-INTERACTIVE",
    deadline: d("2026-06-05"),
    feeUsd: 270,
    priority: "medium",
    status: "identified",
    fitScore: 72,
    fitRationale: "Best Content Marketing Strategy. Strong COL Group narrative ready.",
  },
  {
    name: "Campaign Asia PR Awards",
    organizer: "Campaign Asia-Pacific",
    deadline: d("2026-07-14"),
    priority: "high",
    status: "identified",
    fitScore: 85,
    fitRationale: "COL Group's earned-media campaign as B2B PR case study.",
  },
];
