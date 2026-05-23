/**
 * Hydrate Tim OS from the curated intelligence. Idempotent — safe to re-run.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { SEED_CONTACTS } from "../src/lib/data/seed-contacts";
import { SEED_AWARDS } from "../src/lib/data/seed-awards";
import { SEED_SPEAKING } from "../src/lib/data/seed-speaking";
import { SEED_MEDIA_TARGETS } from "../src/lib/data/seed-media";
import { SEED_PRESS } from "../src/lib/data/seed-press";

const prisma = new PrismaClient();

const slug = (s: string) => s.toLowerCase().replace(/\W+/g, "-").slice(0, 60);

async function main() {
  console.log("→ Seeding Tim OS...");

  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      weeklyFocus:
        "Build LA trip momentum (Jun 1-4). Pitch The Town. Launch Vertical View newsletter. Close Cannes Lions submission.",
      campaignGoals: JSON.stringify({
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
      }),
    },
  });

  for (const c of SEED_CONTACTS) {
    const id = `seed-${slug(c.name)}`;
    await prisma.contact.upsert({
      where: { id },
      update: { tier: c.tier, role: c.role, company: c.company, notes: c.notes, strategicValue: c.strategicValue },
      create: { id, ...c },
    });
  }
  console.log(`  ✓ ${SEED_CONTACTS.length} contacts`);

  for (const a of SEED_AWARDS) {
    const id = `seed-${slug(a.name)}`;
    await prisma.award.upsert({
      where: { id },
      update: { priority: a.priority, status: a.status, deadline: a.deadline },
      create: { id, ...a },
    });
  }
  console.log(`  ✓ ${SEED_AWARDS.length} awards`);

  for (const s of SEED_SPEAKING) {
    const id = `seed-${slug(s.name)}`;
    await prisma.speakingEvent.upsert({
      where: { id },
      update: { status: s.status, startsAt: s.startsAt },
      create: { id, ...s },
    });
  }
  console.log(`  ✓ ${SEED_SPEAKING.length} speaking events`);

  for (const m of SEED_MEDIA_TARGETS) {
    const id = `seed-${slug(m.outlet)}`;
    await prisma.mediaTarget.upsert({
      where: { id },
      update: { tier: m.tier, pitchAngle: m.pitchAngle },
      create: { id, ...m },
    });
  }
  console.log(`  ✓ ${SEED_MEDIA_TARGETS.length} media targets`);

  for (const p of SEED_PRESS) {
    const id = `seed-${slug(p.outlet + "-" + p.title)}`;
    await prisma.pressItem.upsert({
      where: { id },
      update: {},
      create: { id, ...p },
    });
  }
  console.log(`  ✓ ${SEED_PRESS.length} press items`);

  console.log("✓ Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
