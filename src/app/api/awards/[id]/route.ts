import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { status?: string; priority?: string; notes?: string };
  const updated = await prisma.award.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.priority && { priority: body.priority }),
      ...(body.notes && { notes: body.notes }),
      ...(body.status === "submitted" ? { submittedAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ ok: true, award: updated });
}
