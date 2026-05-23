/**
 * One-shot seed endpoint for production deploys.
 *
 *   curl -X POST -H "Authorization: Bearer $AGENT_SECRET" https://your-app.vercel.app/api/admin/seed
 *
 * Idempotent — safe to call multiple times. Hydrates Settings, Contacts,
 * Awards, SpeakingEvents, MediaTargets, and PressItems from the curated
 * intelligence repository.
 */
import { NextRequest, NextResponse } from "next/server";
import { checkAgentAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SEED_CONTACTS } from "@/lib/data/seed-contacts";
import { SEED_AWARDS } from "@/lib/data/seed-awards";
import { SEED_SPEAKING } from "@/lib/data/seed-speaking";
import { SEED_MEDIA_TARGETS } from "@/lib/data/seed-media";
import { SEED_PRESS } from "@/lib/data/seed-press";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const slug = (s: string) => s.toLowerCase().replace(/\W+/g, "-").slice(0, 60);

export async function POST(req: NextRequest) {
  if (!checkAgentAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
          "C-level recognition via major awards",
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
    await prisma.contact.upsert({ where: { id }, update: {}, create: { id, ...c } });
  }
  for (const a of SEED_AWARDS) {
    const id = `seed-${slug(a.name)}`;
    await prisma.award.upsert({ where: { id }, update: {}, create: { id, ...a } });
  }
  for (const s of SEED_SPEAKING) {
    const id = `seed-${slug(s.name)}`;
    await prisma.speakingEvent.upsert({ where: { id }, update: {}, create: { id, ...s } });
  }
  for (const m of SEED_MEDIA_TARGETS) {
    const id = `seed-${slug(m.outlet)}`;
    await prisma.mediaTarget.upsert({ where: { id }, update: {}, create: { id, ...m } });
  }
  for (const p of SEED_PRESS) {
    const id = `seed-${slug(p.outlet + "-" + p.title)}`;
    await prisma.pressItem.upsert({ where: { id }, update: {}, create: { id, ...p } });
  }

  return NextResponse.json({
    ok: true,
    contacts: SEED_CONTACTS.length,
    awards: SEED_AWARDS.length,
    speaking: SEED_SPEAKING.length,
    media: SEED_MEDIA_TARGETS.length,
    press: SEED_PRESS.length,
  });
}
