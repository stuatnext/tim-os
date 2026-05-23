import { prisma } from "@/lib/prisma";
import { Card, Pill } from "@/components/Card";

export const dynamic = "force-dynamic";

const tierLabel: Record<number, string> = {
  1: "Tier 1 — Closest allies",
  2: "Tier 2 — Active partners",
  3: "Tier 3 — Strategic targets",
};

const tierTone: Record<number, "gold" | "teal" | "amber"> = {
  1: "gold",
  2: "teal",
  3: "amber",
};

export default async function RelationshipsPage() {
  const contacts = await prisma.contact.findMany({ orderBy: [{ tier: "asc" }, { name: "asc" }] });

  const grouped = new Map<number, typeof contacts>();
  for (const c of contacts) {
    if (!grouped.has(c.tier)) grouped.set(c.tier, []);
    grouped.get(c.tier)!.push(c);
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <header className="border-b border-line pb-4">
        <div className="text-[11px] uppercase tracking-widest text-muted">Relationships</div>
        <h1 className="text-3xl font-semibold mt-1">Network</h1>
        <p className="text-sm text-muted mt-1">
          The people who can make Tim and COL rich. Tier 1 are family. Tier 3 is who's next.
        </p>
      </header>

      {[1, 2, 3].map((tier) => {
        const items = grouped.get(tier) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={tier}>
            <h2 className="text-lg font-semibold mb-3">{tierLabel[tier]}</h2>
            <div className="grid grid-cols-2 gap-3">
              {items.map((c) => (
                <Card key={c.id} accent={tierTone[tier]}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted">
                        {c.role}{c.company ? ` · ${c.company}` : ""}
                      </div>
                    </div>
                    <Pill tone={tierTone[tier]}>{c.category}</Pill>
                  </div>
                  {c.strategicValue && (
                    <p className="text-xs text-ink/80 mt-2 italic">{c.strategicValue}</p>
                  )}
                  {c.notes && <p className="text-xs text-muted mt-2">{c.notes}</p>}
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
