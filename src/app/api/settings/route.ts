import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    weeklyFocus?: string;
    voiceTuning?: string;
    campaignGoals?: string;
  };
  const updated = await prisma.settings.upsert({
    where: { id: "default" },
    update: body,
    create: { id: "default", ...body },
  });
  return NextResponse.json({ ok: true, settings: updated });
}
