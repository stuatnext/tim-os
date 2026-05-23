"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Brief", desc: "Monday morning" },
  { href: "/opportunities", label: "Opportunities", desc: "Awards & events" },
  { href: "/intelligence", label: "Intelligence", desc: "Industry feed" },
  { href: "/content", label: "Content", desc: "LinkedIn drafts" },
  { href: "/relationships", label: "Relationships", desc: "Network" },
  { href: "/press", label: "Press", desc: "Coverage" },
  { href: "/voice", label: "Voice & focus", desc: "Calibration" },
  { href: "/runs", label: "Agent runs", desc: "Observability" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="border-r border-line bg-white/40 backdrop-blur-sm p-5 flex flex-col">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-muted">Tim OS</div>
        <div className="mt-1 text-lg font-semibold text-ink leading-tight">
          Vertical entertainment<br />intelligence
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`block rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-ink text-paper"
                  : "text-ink/80 hover:bg-line/60 hover:text-ink"
              }`}
            >
              <div className="font-medium">{n.label}</div>
              <div className={`text-[11px] ${active ? "text-paper/70" : "text-muted"}`}>{n.desc}</div>
            </Link>
          );
        })}
      </nav>

      <div className="text-[11px] text-muted leading-relaxed mt-6">
        <div className="font-medium text-ink">Tim Oh</div>
        <div>Global CMO & GM, COL Group International</div>
        <div className="mt-2">Singapore · linkedin.com/in/timjalvin</div>
      </div>
    </aside>
  );
}
