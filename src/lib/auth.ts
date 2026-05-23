/**
 * Bearer token guard for cron-callable endpoints. Cron systems hit these with
 * Authorization: Bearer $AGENT_SECRET. In local dev we leave it empty.
 */
import { NextRequest } from "next/server";

export function checkAgentAuth(req: NextRequest): boolean {
  const secret = process.env.AGENT_SECRET;
  if (!secret) return true; // dev mode — no secret set, allow.
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}
