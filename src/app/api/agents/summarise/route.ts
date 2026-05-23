import { NextRequest, NextResponse } from "next/server";
import { summariseBatch } from "@/lib/agents/rss-summariser";
import { checkAgentAuth } from "@/lib/auth";
import { trackRun } from "@/lib/run-trace";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!checkAgentAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const result = await trackRun("rss-summariser", async () => {
      const r = await summariseBatch(limit);
      return { ...r, itemsUpdated: r.updated };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
