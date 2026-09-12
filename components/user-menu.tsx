"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, User, Settings, RefreshCw, LogOut, ShieldCheck } from "lucide-react";
import { initials } from "@/lib/format";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  operation: "Operation",
  director: "Director",
  finance: "Finance",
  hr_pic: "HR / PIC",
  customer: "Customer",
};
const LIMITED = ["hr_pic", "customer"];

export function UserMenu({
  name,
  email,
  role,
  onLogout,
}: {
  name: string;
  email: string;
  role: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
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

  const label = roleLabel[role] ?? role ?? "Pengguna";
  const isLimited = LIMITED.includes(role);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted ${
          open ? "bg-muted" : ""
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-xs font-bold text-white">
          {initials(name)}
        </div>
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
        <ChevronDown size={15} className={`hidden text-muted-foreground transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {/* Header profil */}
          <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/[0.08] to-transparent px-4 py-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal text-sm font-bold text-white">
              {initials(name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email || "—"}</p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <ShieldCheck size={10} /> {label}
              </span>
            </div>
          </div>

          {/* Aksi */}
          <div className="p-1.5">
            {!isLimited && (
              <>
                <Link
                  href="/akun"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <User size={16} className="text-muted-foreground" /> Kelola Akun
                </Link>
                <Link
                  href="/pengaturan"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <Settings size={16} className="text-muted-foreground" /> Pengaturan
                </Link>
              </>
            )}
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              <RefreshCw size={16} className="text-muted-foreground" /> Ganti Akun
            </button>
          </div>

          <div className="border-t border-border p-1.5">
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-brand-red hover:bg-brand-red/10"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
