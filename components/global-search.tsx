"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, Users, Building2, FileText, LayoutGrid } from "lucide-react";

export type SearchItem = { label: string; sub?: string; href: string; kind: "karyawan" | "klien" | "invoice" | "halaman" };

const kindMeta: Record<SearchItem["kind"], { Icon: typeof Users; label: string }> = {
  karyawan: { Icon: Users, label: "Karyawan" },
  klien: { Icon: Building2, label: "Klien" },
  invoice: { Icon: FileText, label: "Invoice" },
  halaman: { Icon: LayoutGrid, label: "Halaman" },
};

export function GlobalSearch({ index, className = "" }: { index: SearchItem[]; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return index
      .filter((it) => it.label.toLowerCase().includes(term) || it.sub?.toLowerCase().includes(term))
      .slice(0, 8);
  }, [q, index]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(it: SearchItem) {
    setOpen(false);
    setQ("");
    router.push(it.href);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <Search
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => q && setOpen(true)}
        onKeyDown={onKey}
        className="input rounded-full pl-9 pr-16 transition-shadow focus:ring-2 focus:ring-primary/30"
        placeholder="Cari karyawan, klien, invoice, halaman…"
        aria-label="Pencarian"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
        <CornerDownLeft size={11} /> Enter
      </kbd>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Tidak ada hasil untuk “{q}”.
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {results.map((it, i) => {
                const M = kindMeta[it.kind];
                return (
                  <li key={it.href + it.label}>
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(it)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
                        i === active ? "bg-primary/10" : "hover:bg-muted"
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <M.Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{it.label}</span>
                        {it.sub && <span className="block truncate text-xs text-muted-foreground">{it.sub}</span>}
                      </span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {M.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
