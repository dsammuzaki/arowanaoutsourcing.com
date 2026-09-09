"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Logo } from "./logo";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  Banknote,
  FileText,
  Handshake,
  Settings,
  UserPlus,
  CalendarDays,
  Target,
  FileClock,
  Info,
  SquareKanban,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";

const nav = [
  { group: "Utama", items: [{ href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard }] },
  {
    group: "Operasional",
    items: [
      { href: "/karyawan", label: "Data Karyawan", Icon: Users },
      { href: "/absensi", label: "Absensi", Icon: CalendarCheck },
    ],
  },
  {
    group: "SDM",
    items: [
      { href: "/rekrutmen", label: "Rekrutmen", Icon: UserPlus },
      { href: "/kontrak", label: "Monitoring Kontrak", Icon: FileClock },
      { href: "/proyek", label: "Manajemen Proyek", Icon: SquareKanban },
      { href: "/cuti", label: "Manajemen Cuti", Icon: CalendarDays },
      { href: "/kinerja", label: "Kinerja & KPI", Icon: Target },
    ],
  },
  {
    group: "Keuangan",
    items: [
      { href: "/payroll", label: "Payroll & Slip Gaji", Icon: Wallet },
      { href: "/pencairan", label: "Pencairan Gaji", Icon: Banknote },
      { href: "/invoice", label: "Invoice Klien", Icon: FileText },
      { href: "/fee", label: "Fee / Komisi", Icon: Handshake },
    ],
  },
  {
    group: "Sistem",
    items: [
      { href: "/about", label: "Tentang ABP", Icon: Info },
      { href: "/pengaturan", label: "Pengaturan", Icon: Settings },
    ],
  },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {nav.map((section) => (
        <div key={section.group}>
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
            {section.group}
          </p>
          <div className="space-y-1">
            {section.items.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-teal text-white shadow-sm"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    size={18}
                    className={active ? "text-white" : "text-white/50 group-hover:text-white/80"}
                  />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-3 px-5 py-5">
        <Logo size={38} />
        <div className="leading-tight">
          <p className="text-[13px] font-bold leading-tight text-white">
            Arowana Bintang Perdana
          </p>
          <p className="text-[11px] text-teal-soft">Outsourcing System</p>
        </div>
      </div>
      <NavLinks pathname={pathname} onNavigate={onNavigate} />
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Keluar
        </Link>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
      aria-label="Ganti tema"
    >
      {mounted ? dark ? <Sun size={20} /> : <Moon size={20} /> : <span className="block h-5 w-5" />}
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed h-screen w-64">
          <SidebarInner />
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/70" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <SidebarInner onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input className="input pl-9" placeholder="Cari karyawan, klien, invoice…" />
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted">
              <Bell size={20} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-red" />
            </button>
            <div className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-muted">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-xs font-bold text-white">
                AH
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-semibold text-foreground">Agus Hidayatulloh</p>
                <p className="text-[11px] text-muted-foreground">Manager Operation</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
