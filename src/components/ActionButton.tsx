"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * One-click POST to an internal endpoint, then refresh the route. Used for
 * "Generate brief", "Refresh feeds", "Re-rank with AI", etc.
 */
export function ActionButton({
  endpoint,
  children,
  variant = "primary",
}: {
  endpoint: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  const styles =
    variant === "primary"
      ? "bg-ink text-paper hover:opacity-90"
      : "border border-line text-ink hover:bg-line/40";

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={run}
        disabled={busy}
        className={`rounded-md text-sm px-4 py-2 disabled:opacity-50 transition ${styles}`}
      >
        {busy ? "Running..." : children}
      </button>
      {error && <div className="text-[11px] text-danger mt-1 max-w-xs text-right">{error}</div>}
    </div>
  );
}
