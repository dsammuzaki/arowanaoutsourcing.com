"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Logo } from "./logo";
import { createClient } from "@/utils/supabase/client";
import { initials } from "@/lib/format";
import { OnboardingQuest } from "./onboarding-quest";
import { NotificationsBell } from "./notifications-bell";
import { GlobalSearch, type SearchItem } from "./global-search";

export type ShellUser = { email: string; name: string; role: string } | null;

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  operation: "Operation",
  director: "Director",
  finance: "Finance",
  hr_pic: "HR / PIC",
  customer: "Customer",
};

// Role terbatas: hanya boleh melihat halaman tertentu
const ROLE_PAGES: Record<string, string[]> = {
  hr_pic: ["/dashboard", "/karyawan", "/absensi"],
  customer: ["/dashboard", "/absensi", "/karyawan", "/bpjs", "/payroll"],
};
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
  ShieldCheck,
  HeartPulse,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; Icon: LucideIcon; roles?: string[] };
type NavSection = { group: string; items: NavItem[] };

const nav: NavSection[] = [
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
      { href: "/bpjs", label: "BPJS", Icon: HeartPulse },
      { href: "/invoice", label: "Invoice Klien", Icon: FileText },
      { href: "/fee", label: "Fee / Komisi", Icon: Handshake },
    ],
  },
  {
    group: "Sistem",
    items: [
      { href: "/akun", label: "Manajemen Akun", Icon: ShieldCheck, roles: ["super_admin"] },
      { href: "/persetujuan", label: "Persetujuan", Icon: ClipboardCheck, roles: ["super_admin", "operation", "director"] },
      { href: "/about", label: "Tentang BSU", Icon: Info },
      { href: "/pengaturan", label: "Pengaturan", Icon: Settings },
    ],
  },
];

function NavLinks({
  pathname,
  role,
  onNavigate,
}: {
  pathname: string;
  role?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {nav.map((section) => {
        const allowed = role ? ROLE_PAGES[role] : undefined;
        const items = section.items.filter((it) => {
          if (it.roles) return role ? it.roles.includes(role) : false; // gate eksplisit (akun, persetujuan)
          if (allowed) return allowed.includes(it.href); // role terbatas: hanya allowlist
          return true; // role penuh: semua
        });
        if (items.length === 0) return null;
        return (
        <div key={section.group}>
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
            {section.group}
          </p>
          <div className="space-y-1">
            {items.map(({ href, label, Icon }) => {
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
        );
      })}
    </nav>
  );
}

function SidebarInner({
  role,
  onNavigate,
  onLogout,
}: {
  role?: string;
  onNavigate?: () => void;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="safe-top flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-3 px-5 py-5">
        <Logo size={38} />
        <div className="leading-tight">
          <p className="text-[13px] font-bold leading-tight text-white">
            Barata Sakti Utama
          </p>
          <p className="text-[11px] text-teal-soft">Outsourcing System</p>
        </div>
      </div>
      <NavLinks pathname={pathname} role={role} onNavigate={onNavigate} />
      <div className="border-t border-white/10 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Keluar
        </button>
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

export function AppShell({
  children,
  user,
  searchIndex = [],
}: {
  children: React.ReactNode;
  user?: ShellUser;
  searchIndex?: SearchItem[];
}) {
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        await createClient().auth.signOut();
      } catch {}
    }
    window.location.href = "/";
  }

  const displayName = user?.name || "Pengguna";
  const displayRole = user ? roleLabel[user.role] ?? user.role : "Demo";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed h-screen w-64">
          <SidebarInner role={user?.role} onLogout={handleLogout} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/70" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <SidebarInner role={user?.role} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header
          className="safe-top sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6"
        >
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>
          <GlobalSearch index={searchIndex} className="hidden max-w-md flex-1 sm:block" />
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <NotificationsBell />
            <div className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-muted">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-xs font-bold text-white">
                {initials(displayName)}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                <p className="text-[11px] text-muted-foreground">{displayRole}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="safe-bottom border-t border-border bg-card/60 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-2">
              <Logo size={22} />
              <span className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} <span className="font-semibold text-foreground">PT. Barata Sakti Utama</span>. Hak cipta dilindungi.
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Sistem Manajemen Outsourcing · BSU</span>
          </div>
        </footer>
      </div>

      <OnboardingQuest />
    </div>
  );
}
