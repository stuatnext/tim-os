import { NextRequest, NextResponse } from "next/server";
import { rerankAll } from "@/lib/agents/opportunity-ranker";
import { checkAgentAuth } from "@/lib/auth";
import { trackRun } from "@/lib/run-trace";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!checkAgentAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await trackRun("opportunity-ranker", async () => {
      const r = await rerankAll();
      return {
        ...r,
        itemsUpdated: r.awards.updated + r.speaking.updated + r.media.updated,
      };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
