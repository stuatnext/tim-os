import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyBrief } from "@/lib/agents/brief";
import { checkAgentAuth } from "@/lib/auth";
import { trackRun } from "@/lib/run-trace";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!checkAgentAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const brief = await trackRun("weekly-brief", async () => {
      const b = await generateWeeklyBrief();
      return { ...b, itemsCreated: 1 };
    });
    return NextResponse.json({ ok: true, brief });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
