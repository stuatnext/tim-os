/**
 * One-shot: hydrate data/state/*.json from the curated seed data, then
 * render an initial docs/index.html. Idempotent — safe to re-run.
 *
 *   npm run init
 */
import { SEED_CONTACTS } from "../src/lib/data/seed-contacts";
import { SEED_AWARDS } from "../src/lib/data/seed-awards";
import { SEED_SPEAKING } from "../src/lib/data/seed-speaking";
import { SEED_MEDIA_TARGETS } from "../src/lib/data/seed-media";
import { SEED_PRESS } from "../src/lib/data/seed-press";
import {
  store,
  type Settings,
  type Contact,
  type Award,
  type SpeakingEvent,
  type MediaTarget,
  type PressItem,
} from "../src/lib/store";
import { renderDashboard } from "../src/render";

const slug = (s: string) => s.toLowerCase().replace(/\W+/g, "-").slice(0, 60);

async function main() {
  console.log("→ Initialising Tim OS state...");

  // Settings — only seed if blank.
  const existingSettings = await store.getSettings();
  if (!existingSettings.weeklyFocus) {
    const settings: Settings = {
      weeklyFocus:
        "Build LA trip momentum (Jun 1-4). Pitch The Town. Launch Vertical View newsletter. Close Cannes Lions submission.",
      voiceTuning: "",
      campaignGoals: {
        twelveMonth: [
          "Undisputed English-language authority on micro-drama / vertical content globally",
          "Wikipedia page live",
          "Speaking bureau registered",
          "15K+ LinkedIn followers",
          "C-level recognition via major awards (40 Under 40, Cannes Lion or equivalent)",
          "COL Group brand equity matched to commercial ambitions",
        ],
        thisQuarter: [
          "Launch The Vertical View LinkedIn newsletter",
          "Land one Tier 1 podcast (The Town, MFM, or DOAC)",
          "Submit 5+ award entries",
          "Cement Vertical 2.0 framing in press",
        ],
      },
      updatedAt: new Date().toISOString(),
    };
    await store.setSettings(settings);
  }
  console.log("  ✓ settings");

  // Contacts.
  const existingContacts = await store.getContacts();
  const contactById = new Map(existingContacts.map((c) => [c.id, c]));
  for (const c of SEED_CONTACTS) {
    const id = `seed-${slug(c.name)}`;
    if (!contactById.has(id)) {
      const contact: Contact = { id, ...c };
      existingContacts.push(contact);
    }
  }
  await store.setContacts(existingContacts);
  console.log(`  ✓ ${existingContacts.length} contacts`);

  // Awards.
  const existingAwards = await store.getAwards();
  const awardsById = new Map(existingAwards.map((a) => [a.id, a]));
  for (const a of SEED_AWARDS) {
    const id = `seed-${slug(a.name)}`;
    if (!awardsById.has(id)) {
      const award: Award = {
        id,
        ...a,
        deadline: a.deadline?.toISOString(),
        ceremonyAt: a.ceremonyAt?.toISOString(),
        priority: a.priority as Award["priority"],
        status: a.status as Award["status"],
      };
      existingAwards.push(award);
    }
  }
  await store.setAwards(existingAwards);
  console.log(`  ✓ ${existingAwards.length} awards`);

  // Speaking.
  const existingSpeaking = await store.getSpeaking();
  const speakingById = new Map(existingSpeaking.map((s) => [s.id, s]));
  for (const s of SEED_SPEAKING) {
    const id = `seed-${slug(s.name)}`;
    if (!speakingById.has(id)) {
      const event: SpeakingEvent = {
        id,
        ...s,
        startsAt: s.startsAt?.toISOString(),
        endsAt: s.endsAt?.toISOString(),
        cfpDeadline: s.cfpDeadline?.toISOString(),
        status: s.status as SpeakingEvent["status"],
      };
      existingSpeaking.push(event);
    }
  }
  await store.setSpeaking(existingSpeaking);
  console.log(`  ✓ ${existingSpeaking.length} speaking events`);

  // Media.
  const existingMedia = await store.getMedia();
  const mediaById = new Map(existingMedia.map((m) => [m.id, m]));
  for (const m of SEED_MEDIA_TARGETS) {
    const id = `seed-${slug(m.outlet)}`;
    if (!mediaById.has(id)) {
      const target: MediaTarget = { id, ...m, status: m.status as MediaTarget["status"] };
      existingMedia.push(target);
    }
  }
  await store.setMedia(existingMedia);
  console.log(`  ✓ ${existingMedia.length} media targets`);

  // Press.
  const existingPress = await store.getPress();
  const pressById = new Map(existingPress.map((p) => [p.id, p]));
  for (const p of SEED_PRESS) {
    const id = `seed-${slug(p.outlet + "-" + p.title)}`;
    if (!pressById.has(id)) {
      const item: PressItem = {
        id,
        ...p,
        publishedAt: p.publishedAt?.toISOString(),
        type: p.type as PressItem["type"],
      };
      existingPress.push(item);
    }
  }
  await store.setPress(existingPress);
  console.log(`  ✓ ${existingPress.length} press items`);

  console.log("→ Rendering docs/index.html...");
  const { bytes } = await renderDashboard();
  console.log(`  ✓ ${(bytes / 1024).toFixed(1)} kB`);

  console.log("✓ Tim OS initialised.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
