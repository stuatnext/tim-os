import { prisma } from "@/lib/prisma";
import { Card, Pill } from "@/components/Card";
import { GenerateForm } from "./GenerateForm";
import { ContentActions } from "./ContentActions";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "gray" | "teal" | "amber" | "red" | "ink"> = {
  draft: "gray",
  approved: "teal",
  scheduled: "amber",
  posted: "ink",
  dismissed: "red",
};

export default async function ContentPage() {
  const ideas = await prisma.contentIdea.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 30,
  });

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <header className="border-b border-line pb-4">
        <div className="text-[11px] uppercase tracking-widest text-muted">Content</div>
        <h1 className="text-3xl font-semibold mt-1">LinkedIn drafts</h1>
        <p className="text-sm text-muted mt-1">
          Three drafts at a time — data-led, contrarian, vulnerability+anchor. Sonnet writes in Tim's
          voice from the cached voice bank.
        </p>
      </header>

      <GenerateForm />

      <div className="space-y-4">
        {ideas.length === 0 && (
          <Card>
            <p className="text-sm text-muted">No drafts yet. Generate a batch above.</p>
          </Card>
        )}
        {ideas.map((idea) => (
          <Card key={idea.id} accent={idea.status === "approved" ? "teal" : undefined}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Pill tone={statusTone[idea.status] ?? "gray"}>{idea.status}</Pill>
                {idea.predictedEngagement && (
                  <Pill tone={idea.predictedEngagement === "high" ? "teal" : "gray"}>
                    predicted {idea.predictedEngagement}
                  </Pill>
                )}
                <span className="text-[11px] text-muted">{idea.format}</span>
              </div>
              <span className="text-[11px] text-muted">
                {idea.createdAt.toISOString().slice(0, 10)}
              </span>
            </div>
            <div className="font-medium text-ink mb-2">"{idea.hook}"</div>
            <pre className="text-sm whitespace-pre-wrap font-sans text-ink/85 leading-relaxed">
              {idea.body}
            </pre>
            {idea.rationale && (
              <p className="text-xs text-muted mt-3 italic">Why this works: {idea.rationale}</p>
            )}
            <ContentActions id={idea.id} status={idea.status} />
          </Card>
        ))}
      </div>
    </div>
  );
}
