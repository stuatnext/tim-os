import { prisma } from "@/lib/prisma";
import { Card, Pill } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function PressPage() {
  const items = await prisma.pressItem.findMany({ orderBy: [{ tier: "asc" }, { publishedAt: "desc" }] });

  const tier1 = items.filter((i) => i.tier === 1);
  const tier2 = items.filter((i) => i.tier === 2);

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <header className="border-b border-line pb-4">
        <div className="text-[11px] uppercase tracking-widest text-muted">Press</div>
        <h1 className="text-3xl font-semibold mt-1">Coverage record</h1>
        <p className="text-sm text-muted mt-1">
          Source of truth for the press kit. Used by the AI to reference existing coverage in
          briefs and pitches.
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Tier 1 — Global trade & mainstream</h2>
        <div className="space-y-2">
          {tier1.map((p) => (
            <Card key={p.id} accent="gold">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted">{p.outlet}</div>
                  <div className="font-medium">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                        {p.title}
                      </a>
                    ) : (
                      p.title
                    )}
                  </div>
                  {p.summary && <p className="text-xs text-muted mt-1">{p.summary}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill tone="gold">{p.type}</Pill>
                  {p.publishedAt && (
                    <span className="text-[11px] text-muted">
                      {p.publishedAt.toISOString().slice(0, 10)}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Tier 2 — Trade & specialist</h2>
        <div className="space-y-2">
          {tier2.map((p) => (
            <Card key={p.id}>
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted">{p.outlet}</div>
                  <div className="font-medium">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                        {p.title}
                      </a>
                    ) : (
                      p.title
                    )}
                  </div>
                  {p.summary && <p className="text-xs text-muted mt-1">{p.summary}</p>}
                </div>
                <Pill tone="gray">{p.type}</Pill>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
