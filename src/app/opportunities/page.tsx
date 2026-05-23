import { prisma } from "@/lib/prisma";
import { Card, Pill } from "@/components/Card";
import { ActionButton } from "@/components/ActionButton";

export const dynamic = "force-dynamic";

const priorityTone: Record<string, "red" | "teal" | "amber" | "gray"> = {
  urgent: "red",
  high: "teal",
  medium: "amber",
  low: "gray",
};

function daysUntil(d: Date | null) {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function OpportunitiesPage() {
  const [awards, speaking, media] = await Promise.all([
    prisma.award.findMany({ orderBy: [{ priority: "asc" }, { deadline: "asc" }] }),
    prisma.speakingEvent.findMany({ orderBy: { startsAt: "asc" } }),
    prisma.mediaTarget.findMany({ orderBy: [{ tier: "asc" }, { outlet: "asc" }] }),
  ]);

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <header className="border-b border-line pb-4 flex justify-between items-end">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted">Opportunities</div>
          <h1 className="text-3xl font-semibold mt-1">Pipeline</h1>
          <p className="text-sm text-muted mt-1">
            Awards · speaking · media pitches. The opportunity ranker (Sonnet) scores each against
            Tim's current campaign focus.
          </p>
        </div>
        <ActionButton endpoint="/api/agents/rank-opportunities">Re-rank with AI</ActionButton>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Awards</h2>
        <div className="grid grid-cols-2 gap-3">
          {awards.map((a) => {
            const days = daysUntil(a.deadline);
            return (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-medium">{a.name}</div>
                  <Pill tone={priorityTone[a.priority]}>{a.priority}</Pill>
                </div>
                <div className="text-xs text-muted mb-2">
                  {a.organizer ?? "—"} · {a.category ?? "category TBD"}
                </div>
                <div className="text-xs text-ink/80 mb-2">
                  {a.deadline ? (
                    <span>
                      Deadline {a.deadline.toISOString().slice(0, 10)}
                      {days !== null && (
                        <span className={`ml-2 ${days <= 14 ? "text-danger" : "text-muted"}`}>
                          ({days >= 0 ? `${days}d left` : `${-days}d overdue`})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted">No deadline set</span>
                  )}
                </div>
                {a.fitScore !== null && a.fitScore !== undefined && (
                  <div className="text-xs">
                    <span className="text-muted">Fit:</span>{" "}
                    <span className="font-semibold">{a.fitScore}/100</span>
                  </div>
                )}
                {a.fitRationale && (
                  <p className="text-xs text-ink/70 mt-2 line-clamp-3">{a.fitRationale}</p>
                )}
                <div className="mt-3 flex gap-2 text-[11px]">
                  <Pill tone="gray">{a.status}</Pill>
                  {a.feeUsd && <Pill tone="amber">${a.feeUsd}</Pill>}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Speaking</h2>
        <div className="grid grid-cols-2 gap-3">
          {speaking.map((s) => (
            <Card key={s.id} accent={s.status === "confirmed" ? "teal" : s.status === "done" ? undefined : "gold"}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-medium">{s.name}</div>
                <Pill tone={s.status === "confirmed" ? "teal" : "gray"}>{s.status}</Pill>
              </div>
              <div className="text-xs text-muted mb-2">
                {s.location ?? "—"} · {s.startsAt?.toISOString().slice(0, 10) ?? "TBD"}
              </div>
              {s.role && <div className="text-xs">Role: {s.role}</div>}
              {s.fitRationale && <p className="text-xs text-ink/70 mt-2 line-clamp-2">{s.fitRationale}</p>}
              {s.notes && <p className="text-xs text-muted mt-2 line-clamp-2">{s.notes}</p>}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Media targets</h2>
        <div className="grid grid-cols-2 gap-3">
          {media.map((m) => (
            <Card key={m.id} accent={m.tier === 1 ? "gold" : undefined}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <div className="font-medium">{m.outlet}</div>
                  <div className="text-xs text-muted">
                    {m.journalist ?? "—"} · {m.beat ?? ""}
                  </div>
                </div>
                <Pill tone={m.tier === 1 ? "gold" : "gray"}>T{m.tier}</Pill>
              </div>
              {m.pitchAngle && <p className="text-xs text-ink/80 mt-2 italic">"{m.pitchAngle}"</p>}
              <div className="mt-3 flex gap-2">
                <Pill tone="gray">{m.status}</Pill>
                {m.contact && <span className="text-[11px] text-muted">{m.contact}</span>}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
