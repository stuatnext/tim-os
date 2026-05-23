import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: "gold" | "teal" | "amber" | "red";
}) {
  const accentBorder =
    accent === "gold"
      ? "border-l-4 border-l-gold"
      : accent === "teal"
        ? "border-l-4 border-l-accent"
        : accent === "amber"
          ? "border-l-4 border-l-warn"
          : accent === "red"
            ? "border-l-4 border-l-danger"
            : "";
  return (
    <div
      className={`rounded-xl bg-white border border-line shadow-card p-5 ${accentBorder} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div className="mb-3">
      {kicker && (
        <div className="text-[11px] uppercase tracking-widest text-muted font-medium">{kicker}</div>
      )}
      <div className="text-base font-semibold text-ink">{children}</div>
    </div>
  );
}

export function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "teal" | "gold" | "amber" | "red" | "ink";
}) {
  const map: Record<string, string> = {
    gray: "bg-line/60 text-ink/70",
    teal: "bg-accent/15 text-accent",
    gold: "bg-gold/15 text-gold",
    amber: "bg-warn/15 text-warn",
    red: "bg-danger/15 text-danger",
    ink: "bg-ink text-paper",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}

export function Stat({ value, label, sub }: { value: ReactNode; label: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-line/40 p-4">
      <div className="text-2xl font-semibold text-ink leading-none">{value}</div>
      <div className="text-xs text-muted mt-2">{label}</div>
      {sub && <div className="text-[10px] text-muted mt-1">{sub}</div>}
    </div>
  );
}
