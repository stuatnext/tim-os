import { NextRequest, NextResponse } from "next/server";
import { refreshFeeds } from "@/lib/rss";
import { checkAgentAuth } from "@/lib/auth";
import { trackRun } from "@/lib/run-trace";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!checkAgentAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await trackRun("rss-refresh", async () => {
      const r = await refreshFeeds();
      return { ...r, itemsCreated: r.inserted };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
