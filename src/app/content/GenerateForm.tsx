"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";

export function GenerateForm() {
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic || undefined }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Generation failed");
      setTopic("");
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Optional: topic to anchor on (e.g. 'LA trip', 'branded micro-dramas')"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="flex-1 rounded-md border border-line px-3 py-2 text-sm bg-paper focus:outline-none focus:border-ink"
          disabled={busy}
        />
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-md bg-ink text-paper text-sm px-4 py-2 disabled:opacity-50 hover:opacity-90"
        >
          {busy ? "Generating..." : "Generate 3 drafts"}
        </button>
      </div>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
      <p className="text-[11px] text-muted mt-2">
        With no topic the agent picks the week's top-relevance news items as inspiration.
      </p>
    </Card>
  );
}
