import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { status?: string; body?: string; hook?: string; notes?: string };
  const updated = await prisma.contentIdea.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.body && { body: body.body }),
      ...(body.hook && { hook: body.hook }),
      ...(body.notes && { notes: body.notes }),
      ...(body.status === "posted" ? { postedAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ ok: true, idea: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contentIdea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
