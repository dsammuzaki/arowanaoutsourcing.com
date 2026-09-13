"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, FileClock, CalendarDays, FileText, CheckCheck } from "lucide-react";

export type NotifItem = {
  id: string;
  title: string;
  desc: string;
  href: string;
  kind: "kontrak" | "cuti" | "invoice" | "approval";
  tone: "teal" | "amber" | "red";
  time: string;
};

const iconByKind: Record<NotifItem["kind"], typeof Bell> = {
  kontrak: FileClock,
  cuti: CalendarDays,
  invoice: FileText,
  approval: CheckCheck,
};

const toneClass: Record<NotifItem["tone"], string> = {
  teal: "bg-primary/10 text-primary",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  red: "bg-red-50 text-brand-red dark:bg-red-950/40",
};

export function NotificationsBell({ items = [] }: { items?: NotifItem[] }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = read ? 0 : items.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          setRead(true);
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
        aria-label="Notifikasi"
        aria-expanded={open}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[9px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-bold text-foreground">Notifikasi</p>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckCheck size={13} /> Ditandai dibaca
            </span>
          </div>
          <div className="max-h-[60vh] divide-y divide-border overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada notifikasi baru 🎉</p>
            )}
            {items.map((n) => {
              const Icon = iconByKind[n.kind];
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClass[n.tone]}`}>
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">{n.time}</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="border-t border-border px-4 py-2.5 text-center">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Lihat semua di Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
