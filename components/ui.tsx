import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const toneMap: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700",
  teal: "bg-teal-soft/60 text-teal-deep",
  gold: "bg-gold-soft/70 text-gold-dark",
  red: "bg-red-50 text-brand-red",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
  navy: "bg-navy/10 text-navy",
};

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: keyof typeof toneMap | string;
}) {
  return <span className={`badge ${toneMap[tone] ?? toneMap.slate}`}>{children}</span>;
}

const statusConfig: Record<string, { tone: string; label: string }> = {
  dibayar: { tone: "green", label: "Dibayar" },
  terkirim: { tone: "teal", label: "Terkirim" },
  jatuh_tempo: { tone: "red", label: "Jatuh Tempo" },
  draft: { tone: "slate", label: "Draft" },
  aktif: { tone: "green", label: "Aktif" },
  keluar: { tone: "slate", label: "Keluar" },
  pending: { tone: "amber", label: "Pending" },
};

export function StatusPill({ status }: { status: string }) {
  const c = statusConfig[status] ?? { tone: "slate", label: status };
  return <Badge tone={c.tone}>{c.label}</Badge>;
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Avatar({ name, tone = "teal" }: { name: string; tone?: "teal" | "navy" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
        tone === "teal" ? "bg-teal" : "bg-navy-600"
      }`}
    >
      {initials}
    </div>
  );
}
