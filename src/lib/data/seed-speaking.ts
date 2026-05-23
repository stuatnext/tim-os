export type SeedSpeaking = {
  name: string;
  organizer?: string;
  location?: string;
  url?: string;
  startsAt?: Date;
  endsAt?: Date;
  cfpDeadline?: Date;
  role?: string;
  status: string;
  fitScore?: number;
  fitRationale?: string;
  notes?: string;
};

const d = (s: string) => new Date(s);

export const SEED_SPEAKING: SeedSpeaking[] = [
  // ===== UPCOMING =====
  {
    name: "LA meetings trip",
    location: "Los Angeles, USA",
    startsAt: d("2026-06-01"),
    endsAt: d("2026-06-04"),
    role: "Attendee",
    status: "confirmed",
    fitScore: 80,
    fitRationale: "Not a speaking event. Platforms, producers, creators, studios, brands. Document with daily LinkedIn posts.",
  },
  {
    name: "NEM Dubrovnik — New Europe Market",
    organizer: "NEM Dubrovnik",
    location: "Dubrovnik, Croatia",
    startsAt: d("2026-06-08"),
    endsAt: d("2026-06-11"),
    role: "Panellist",
    status: "confirmed",
    fitScore: 90,
    fitRationale: "'Microdrama: risky business or industry's next guilty pleasure?' with Maria Rua Aguete, Cassandra Yang, Lukasz Wysocki.",
  },
  {
    name: "APOS Bali",
    organizer: "Media Partners Asia",
    location: "Bali, Indonesia",
    startsAt: d("2026-06-16"),
    endsAt: d("2026-06-18"),
    role: "Speaker",
    status: "confirmed",
    fitScore: 92,
    fitRationale: "Confirmed on speaker slate. Mansha Daswani on site.",
  },

  // ===== PROSPECTIVE =====
  {
    name: "MIPCOM Cannes 2026",
    organizer: "RX France",
    location: "Cannes, France",
    startsAt: d("2026-10-12"),
    endsAt: d("2026-10-15"),
    role: "Panellist",
    status: "identified",
    fitScore: 95,
    fitRationale: "Natural progression from MIP London. Anne Chan can broker. Pitch Vertical 2.0 keynote.",
  },
  {
    name: "ContentAsia Summit 2026",
    organizer: "ContentAsia",
    location: "Singapore",
    role: "Keynote / Panellist",
    status: "identified",
    fitScore: 93,
    fitRationale: "Janine Stein relationship. Tim is the obvious headline speaker for the micro-drama session.",
  },
  {
    name: "Asia TV Forum (ATF) 2026",
    organizer: "Reed Exhibitions",
    location: "Singapore",
    startsAt: d("2026-12-08"),
    endsAt: d("2026-12-10"),
    role: "Keynote",
    status: "identified",
    fitScore: 90,
    fitRationale: "Singapore home market. 2025 masterclass with Enoch Chen was a hit. Aim for keynote slot.",
  },
  {
    name: "SXSW 2027",
    organizer: "SXSW",
    location: "Austin, USA",
    startsAt: d("2027-03-12"),
    cfpDeadline: d("2026-07-21"),
    role: "Panellist",
    status: "identified",
    fitScore: 78,
    fitRationale: "PanelPicker opens summer 2026. Vertical 2.0 + creator-economy crossover.",
  },

  // ===== COMPLETED =====
  {
    name: "Cairns Crocodiles (presented by Pinterest)",
    organizer: "B&T",
    location: "Cairns, Australia",
    startsAt: d("2026-05-19"),
    role: "Headline speaker",
    status: "done",
    notes: "'Maestros of Microdramas' with Nikyah Hutchings. Australia 20% payment rate data revealed.",
  },
  {
    name: "Campaign360",
    organizer: "Campaign Asia-Pacific",
    location: "Singapore",
    startsAt: d("2026-05-20"),
    endsAt: d("2026-05-21"),
    role: "Speaker, Learning Stage",
    status: "done",
    notes: "Branded micro-dramas with Sian Ju Tan (Refinery Media).",
  },
  {
    name: "MIP London 2026",
    organizer: "RX France",
    location: "London, UK",
    startsAt: d("2026-02-24"),
    role: "Headline panellist",
    status: "done",
    notes: "'Microdrama 2026: The Global Breakout.' THR coverage. 131 LinkedIn reactions.",
  },
  {
    name: "Hong Kong FILMART 2026",
    organizer: "HKTDC",
    location: "Hong Kong",
    startsAt: d("2026-03-17"),
    role: "Masterclass leader",
    status: "done",
    notes: "'From Zero to Vertical' with Latif Sim. Launched Microdrama in a Box + SupermodelMe.",
  },
  {
    name: "1 Billion Followers Summit",
    organizer: "Government of UAE",
    location: "Dubai, UAE",
    startsAt: d("2026-01-09"),
    endsAt: d("2026-01-11"),
    role: "Keynote",
    status: "done",
    notes: "On programme with Will Smith and Mr Beast. 91 LinkedIn reactions.",
  },
];
