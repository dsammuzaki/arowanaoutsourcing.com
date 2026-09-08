"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";
import {
  IconDashboard,
  IconUsers,
  IconCalendar,
  IconWallet,
  IconBank,
  IconInvoice,
  IconHandshake,
  IconSettings,
  IconSearch,
  IconBell,
  IconLogout,
  IconMenu,
  IconClose,
} from "./icons";

const nav = [
  { group: "Utama", items: [{ href: "/dashboard", label: "Dashboard", Icon: IconDashboard }] },
  {
    group: "Operasional",
    items: [
      { href: "/karyawan", label: "Data Karyawan", Icon: IconUsers },
      { href: "/absensi", label: "Absensi", Icon: IconCalendar },
    ],
  },
  {
    group: "Keuangan",
    items: [
      { href: "/payroll", label: "Payroll & Slip Gaji", Icon: IconWallet },
      { href: "/pencairan", label: "Pencairan Gaji", Icon: IconBank },
      { href: "/invoice", label: "Invoice Klien", Icon: IconInvoice },
      { href: "/fee", label: "Fee / Komisi", Icon: IconHandshake },
    ],
  },
  { group: "Sistem", items: [{ href: "/pengaturan", label: "Pengaturan", Icon: IconSettings }] },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
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
                    width={19}
                    height={19}
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
    <div className="flex h-full flex-col bg-navy">
      <div className="flex items-center gap-3 px-5 py-5">
        <Logo size={38} />
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">Arowana Bintang</p>
          <p className="text-[11px] text-teal">Outsourcing System</p>
        </div>
      </div>
      <NavLinks pathname={pathname} onNavigate={onNavigate} />
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
        >
          <IconLogout width={19} height={19} />
          Keluar
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed h-screen w-64">
          <SidebarInner />
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <SidebarInner onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <IconSearch
              width={18}
              height={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="input pl-9"
              placeholder="Cari karyawan, klien, invoice…"
            />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <IconBell />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-red" />
            </button>
            <div className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-xs font-bold text-white">
                MR
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-semibold text-navy">Mariyanti</p>
                <p className="text-[11px] text-slate-500">HR &amp; GA Manager</p>
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
