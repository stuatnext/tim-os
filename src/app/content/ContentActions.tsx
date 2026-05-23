"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContentActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(newStatus: string) {
    setBusy(true);
    try {
      await fetch(`/api/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this draft?")) return;
    setBusy(true);
    try {
      await fetch(`/api/content/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-line/70 flex gap-2 text-xs">
      {status !== "approved" && (
        <button onClick={() => update("approved")} disabled={busy} className="rounded bg-accent/15 text-accent px-3 py-1 hover:bg-accent/25 disabled:opacity-50">
          Approve
        </button>
      )}
      {status !== "posted" && (
        <button onClick={() => update("posted")} disabled={busy} className="rounded bg-ink/10 text-ink px-3 py-1 hover:bg-ink/20 disabled:opacity-50">
          Mark posted
        </button>
      )}
      {status !== "dismissed" && (
        <button onClick={() => update("dismissed")} disabled={busy} className="rounded bg-danger/15 text-danger px-3 py-1 hover:bg-danger/25 disabled:opacity-50">
          Dismiss
        </button>
      )}
      <button onClick={remove} disabled={busy} className="ml-auto rounded text-muted px-3 py-1 hover:text-danger disabled:opacity-50">
        Delete
      </button>
    </div>
  );
}
