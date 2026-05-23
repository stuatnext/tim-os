import { NextRequest, NextResponse } from "next/server";
import { generateDrafts } from "@/lib/agents/content-generator";
import { checkAgentAuth } from "@/lib/auth";
import { trackRun } from "@/lib/run-trace";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!checkAgentAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = (await req.json().catch(() => ({}))) as { topic?: string; newsItemIds?: string[] };
    const result = await trackRun("content-generator", async () => {
      const r = await generateDrafts(body);
      return { ...r, itemsCreated: r.drafts.length };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
