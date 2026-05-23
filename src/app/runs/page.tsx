import { prisma } from "@/lib/prisma";
import { Card, Pill } from "@/components/Card";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "teal" | "red" | "amber"> = {
  success: "teal",
  failure: "red",
  running: "amber",
};

export default async function RunsPage() {
  const runs = await prisma.agentRun.findMany({ orderBy: { startedAt: "desc" }, take: 100 });

  return (
    <div className="p-8 space-y-4 max-w-5xl">
      <header className="border-b border-line pb-4">
        <div className="text-[11px] uppercase tracking-widest text-muted">Observability</div>
        <h1 className="text-3xl font-semibold mt-1">Agent runs</h1>
        <p className="text-sm text-muted mt-1">
          Every cron tick logged. Failures show their error inline.
        </p>
      </header>

      {runs.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No runs yet.</p>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-line">
            {runs.map((r) => (
              <div key={r.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{r.agent}</div>
                  <div className="text-[11px] text-muted">
                    {r.startedAt.toISOString().replace("T", " ").slice(0, 19)} UTC
                    {r.finishedAt && (
                      <span>
                        {" "}· {Math.round((r.finishedAt.getTime() - r.startedAt.getTime()) / 1000)}s
                      </span>
                    )}
                  </div>
                  {r.errorMessage && (
                    <pre className="mt-1 text-[11px] text-danger whitespace-pre-wrap">
                      {r.errorMessage}
                    </pre>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill tone={statusTone[r.status] ?? "gray"}>{r.status}</Pill>
                  {(r.itemsCreated > 0 || r.itemsUpdated > 0) && (
                    <span className="text-[11px] text-muted">
                      {r.itemsCreated > 0 && `+${r.itemsCreated} new`}
                      {r.itemsCreated > 0 && r.itemsUpdated > 0 && " · "}
                      {r.itemsUpdated > 0 && `${r.itemsUpdated} updated`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
