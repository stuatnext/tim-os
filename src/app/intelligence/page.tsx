import { prisma } from "@/lib/prisma";
import { Card, Pill } from "@/components/Card";
import { ActionButton } from "@/components/ActionButton";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const items = await prisma.industryItem.findMany({
    orderBy: [{ relevanceScore: "desc" }, { publishedAt: "desc" }],
    take: 50,
  });

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <header className="border-b border-line pb-4 flex justify-between items-end">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted">Intelligence</div>
          <h1 className="text-3xl font-semibold mt-1">Industry feed</h1>
          <p className="text-sm text-muted mt-1">
            RSS items ingested, filtered by Tim's beat keywords, summarised by Haiku, scored for
            relevance against Tim's positioning.
          </p>
        </div>
        <div className="flex gap-2">
          <ActionButton endpoint="/api/feeds/refresh" variant="secondary">
            Refresh feeds
          </ActionButton>
          <ActionButton endpoint="/api/agents/summarise">Summarise new items</ActionButton>
        </div>
      </header>

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            No items yet. Hit <strong>Refresh feeds</strong> to pull from Variety, Deadline, THR,
            Campaign Asia and the rest, then <strong>Summarise new items</strong> to score them.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.id}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted">{it.source}</div>
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ink hover:text-accent"
                  >
                    {it.title}
                  </a>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {it.relevanceScore !== null && (
                    <Pill tone={it.relevanceScore >= 70 ? "teal" : it.relevanceScore >= 40 ? "amber" : "gray"}>
                      {it.relevanceScore}/100
                    </Pill>
                  )}
                  {it.publishedAt && (
                    <span className="text-[11px] text-muted">
                      {it.publishedAt.toISOString().slice(0, 10)}
                    </span>
                  )}
                </div>
              </div>
              {it.aiSummary && <p className="text-sm text-ink/85 mb-2">{it.aiSummary}</p>}
              {it.hook && (
                <div className="text-xs text-accent italic border-l-2 border-accent/40 pl-3 mt-2">
                  Angle: {it.hook}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
