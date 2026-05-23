"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/Card";

export function SettingsForm({
  weeklyFocus,
  voiceTuning,
}: {
  weeklyFocus: string;
  voiceTuning: string;
}) {
  const [focus, setFocus] = useState(weeklyFocus);
  const [tuning, setTuning] = useState(voiceTuning);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyFocus: focus, voiceTuning: tuning }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card accent="teal">
      <CardTitle kicker="This week's focus">What you're pushing on right now</CardTitle>
      <textarea
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-line px-3 py-2 text-sm bg-paper focus:outline-none focus:border-ink"
        placeholder="e.g. Launch The Vertical View newsletter, pitch The Town, close Cannes Lions submission"
      />

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-widest text-muted font-medium mb-1">
          Voice tuning notes
        </div>
        <textarea
          value={tuning}
          onChange={(e) => setTuning(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-line px-3 py-2 text-sm bg-paper focus:outline-none focus:border-ink"
          placeholder="Anything you want the AI to remember about your voice this week. Free-form. E.g. 'avoid mentioning the apartment again, leaning more contrarian'."
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-md bg-ink text-paper text-sm px-4 py-2 disabled:opacity-50 hover:opacity-90"
        >
          {busy ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-xs text-accent">Saved.</span>}
      </div>
    </Card>
  );
}
