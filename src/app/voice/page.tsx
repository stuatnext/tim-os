import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/Card";
import { TIM_PROFILE } from "@/lib/data/tim-profile";
import { VOICE_BANK } from "@/lib/data/voice-bank";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <header className="border-b border-line pb-4">
        <div className="text-[11px] uppercase tracking-widest text-muted">Voice & focus</div>
        <h1 className="text-3xl font-semibold mt-1">Calibration</h1>
        <p className="text-sm text-muted mt-1">
          These are the inputs every AI agent reads. Change them here, the next run picks them up.
        </p>
      </header>

      <SettingsForm
        weeklyFocus={settings?.weeklyFocus ?? ""}
        voiceTuning={settings?.voiceTuning ?? ""}
      />

      <Card>
        <CardTitle kicker="Cached system prompt (Tim profile)">
          What every agent knows about you
        </CardTitle>
        <pre className="text-xs whitespace-pre-wrap font-sans text-ink/80 leading-relaxed">
          {TIM_PROFILE}
        </pre>
      </Card>

      <Card>
        <CardTitle kicker="Voice bank">Your verbatim quotes — used as calibration</CardTitle>
        <pre className="text-xs whitespace-pre-wrap font-sans text-ink/80 leading-relaxed">
          {VOICE_BANK}
        </pre>
      </Card>
    </div>
  );
}
