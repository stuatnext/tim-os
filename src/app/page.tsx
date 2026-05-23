import { prisma } from "@/lib/prisma";
import { Card, CardTitle, Pill, Stat } from "@/components/Card";
import { ActionButton } from "@/components/ActionButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export default async function BriefPage() {
  const weekOf = mondayOf();
  const brief = await prisma.brief.findUnique({ where: { weekOf } });

  const [urgentAwards, upcomingSpeaking, freshNews, draftCount, t1Contacts] = await Promise.all([
    prisma.award.findMany({
      where: { priority: "urgent", status: { in: ["identified", "drafted"] } },
      orderBy: { deadline: "asc" },
      take: 3,
    }),
    prisma.speakingEvent.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 3,
    }),
    prisma.industryItem.findMany({
      where: { relevanceScore: { gte: 70 } },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    prisma.contentIdea.count({ where: { status: "draft" } }),
    prisma.contact.count({ where: { tier: 1 } }),
  ]);

  type Action = { title: string; why: string; deadline?: string };
  type ContentSug = { hook: string; angle: string; predictedEngagement: string };
  type RelMove = { person: string; move: string; why: string };
  type OppFocus = { name: string; why: string; nextStep: string };

  const actions = safeParse<Action[]>(brief?.topActions, []);
  const contentToPost = safeParse<ContentSug[]>(brief?.contentToPost, []);
  const relMoves = safeParse<RelMove[]>(brief?.relationshipMoves, []);
  const focus = safeParse<OppFocus | null>(brief?.opportunityFocus, null);

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <header className="flex items-end justify-between border-b border-line pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted">
            Brief · week of {weekOf.toISOString().slice(0, 10)}
          </div>
          <h1 className="text-3xl font-semibold mt-1">
            {brief?.headline ?? "Monday brief — generate to get this week's plan"}
          </h1>
        </div>
        <ActionButton endpoint="/api/agents/brief">
          {brief ? "Regenerate brief" : "Generate brief"}
        </ActionButton>
      </header>

      <div className="grid grid-cols-4 gap-3">
        <Stat value={urgentAwards.length} label="Urgent award deadlines" />
        <Stat value={upcomingSpeaking.length} label="Speaking events ahead" />
        <Stat value={freshNews.length} label="High-relevance news" sub="last 14 days" />
        <Stat value={draftCount} label="Drafts awaiting review" />
      </div>

      {brief ? (
        <>
          <Card accent="gold">
            <CardTitle kicker="Industry digest">What happened this week</CardTitle>
            <div className="prose-tim text-sm text-ink/85 whitespace-pre-wrap">
              {brief.industryDigest}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card accent="teal">
              <CardTitle kicker="Top actions">Do these things</CardTitle>
              <ol className="space-y-3">
                {actions.map((a, i) => (
                  <li key={i} className="text-sm">
                    <div className="font-medium flex items-baseline justify-between gap-2">
                      <span>{i + 1}. {a.title}</span>
                      {a.deadline && <Pill tone="amber">by {a.deadline.slice(0, 10)}</Pill>}
                    </div>
                    <div className="text-muted text-xs mt-1">{a.why}</div>
                  </li>
                ))}
              </ol>
            </Card>

            <Card accent="amber">
              <CardTitle kicker="Opportunity focus">This week's one thing</CardTitle>
              {focus ? (
                <div className="space-y-2 text-sm">
                  <div className="font-semibold">{focus.name}</div>
                  <p className="text-ink/80">{focus.why}</p>
                  <div className="pt-2 border-t border-line/70">
                    <div className="text-[11px] uppercase tracking-widest text-muted">Next step</div>
                    <div className="font-medium">{focus.nextStep}</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted text-sm">No focus set this week.</p>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardTitle kicker="Content to post">LinkedIn hooks the AI suggests</CardTitle>
              <ul className="space-y-3">
                {contentToPost.map((c, i) => (
                  <li key={i} className="text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">"{c.hook}"</span>
                      <Pill tone={c.predictedEngagement === "high" ? "teal" : "gray"}>
                        {c.predictedEngagement}
                      </Pill>
                    </div>
                    <div className="text-muted text-xs mt-1">{c.angle}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-line/70">
                <Link href="/content" className="text-xs text-accent hover:underline">
                  Review all drafts →
                </Link>
              </div>
            </Card>

            <Card>
              <CardTitle kicker="Relationships">Who to engage</CardTitle>
              <ul className="space-y-3">
                {relMoves.map((r, i) => (
                  <li key={i} className="text-sm">
                    <div className="font-medium">{r.person}</div>
                    <div className="text-ink/80">{r.move}</div>
                    <div className="text-muted text-xs mt-1">{r.why}</div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <p className="text-sm text-muted">
            No brief generated for this week yet. Click <strong>Generate brief</strong> above —
            it runs the strategy agent (Opus) across the last 14 days of intelligence and produces
            your Monday plan.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardTitle kicker={`${t1Contacts} closest allies`}>Tier 1 network</CardTitle>
          <Link href="/relationships" className="text-xs text-accent hover:underline">
            View map →
          </Link>
        </Card>
        <Card>
          <CardTitle kicker="Latest intelligence">Industry feed</CardTitle>
          <Link href="/intelligence" className="text-xs text-accent hover:underline">
            See {freshNews.length} fresh items →
          </Link>
        </Card>
        <Card>
          <CardTitle kicker="Agent activity">Run log</CardTitle>
          <Link href="/runs" className="text-xs text-accent hover:underline">
            See what's running →
          </Link>
        </Card>
      </div>
    </div>
  );
}
