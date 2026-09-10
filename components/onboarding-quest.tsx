"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Users,
  Wallet,
  FileText,
  SquareKanban,
  CalendarDays,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  Rocket,
} from "lucide-react";

const STORAGE_KEY = "abp_onboarding_v1";

type Step = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  href?: string;
  hrefLabel?: string;
};

const steps: Step[] = [
  {
    icon: Sparkles,
    title: "Selamat datang di Sistem ABP 👋",
    desc: "Panduan singkat ini menunjukkan cara memakai aplikasi dari nol — mulai dari mengisi data karyawan sampai payroll, invoice, proyek, dan cuti. Bisa dilewati kapan saja.",
  },
  {
    icon: Users,
    title: "1. Isi Data Karyawan",
    desc: "Langkah pertama: masukkan tenaga kerja Anda. Buka Data Karyawan → klik 'Tambah Karyawan', isi identitas, rekening, status pajak, dan foto. Data tersimpan permanen di database.",
    href: "/karyawan",
    hrefLabel: "Buka Data Karyawan",
  },
  {
    icon: Wallet,
    title: "2. Payroll & Slip Gaji",
    desc: "Gaji dihitung otomatis lengkap dengan PPh 21 & BPJS. Anda bisa melihat rincian per karyawan dan mencetak slip gaji. Rate pajak bisa diubah di menu Pengaturan.",
    href: "/payroll",
    hrefLabel: "Lihat Payroll",
  },
  {
    icon: FileText,
    title: "3. Invoice Klien & Fee",
    desc: "Tagih klien otomatis: Management Fee → PPN 12% → PPh 23, plus Surat Jalan & Internal Memo. Fee/komisi pihak ketiga juga tercatat rapi.",
    href: "/invoice",
    hrefLabel: "Buka Invoice",
  },
  {
    icon: SquareKanban,
    title: "4. Kelola Proyek (Kanban)",
    desc: "Buat goal/proyek, tarik kartu antar kolom, pantau harian (scrum), dan minta approval. Cocok untuk rekrutmen, payroll bulanan, atau onboarding batch.",
    href: "/proyek",
    hrefLabel: "Buka Proyek",
  },
  {
    icon: CalendarDays,
    title: "5. Absensi, Cuti & Kontrak",
    desc: "Pantau kehadiran, kelola pengajuan cuti dengan approval, dan awasi masa kontrak tiap karyawan (peringatan otomatis untuk yang segera berakhir).",
    href: "/kontrak",
    hrefLabel: "Monitoring Kontrak",
  },
  {
    icon: Rocket,
    title: "Siap mulai! 🚀",
    desc: "Itu inti aplikasinya. Mulai dari menambahkan karyawan pertama Anda. Panduan ini bisa dibuka lagi lewat menu Tentang ABP bila perlu.",
    href: "/karyawan",
    hrefLabel: "Mulai: Tambah Karyawan",
  },
];

export function OnboardingQuest() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {}
  }, []);

  function done() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  }

  if (!open) return null;
  const step = steps[i];
  const last = i === steps.length - 1;
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
      <div className="card relative z-10 w-full max-w-md overflow-hidden rounded-b-none rounded-t-2xl sm:rounded-2xl">
        {/* Header banner */}
        <div className="relative overflow-hidden bg-navy px-6 py-6 text-white">
          <span className="hero-anim pointer-events-none absolute inset-0 opacity-40" />
          <button
            onClick={done}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Lewati"
          >
            <X size={18} />
          </button>
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Icon size={26} className="text-teal-soft" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-teal-soft">
                Panduan {i + 1} / {steps.length}
              </p>
              <h3 className="text-lg font-bold leading-tight">{step.title}</h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>

          {step.href && (
            <Link
              href={step.href}
              onClick={done}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/15"
            >
              <CheckCircle2 size={15} /> {step.hrefLabel}
            </Link>
          )}

          {/* Progress dots */}
          <div className="mt-6 flex items-center justify-center gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-5 bg-primary" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <button onClick={done} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Lewati
          </button>
          <div className="flex gap-2">
            {i > 0 && (
              <button className="btn-outline px-3 py-1.5" onClick={() => setI((n) => n - 1)}>
                <ArrowLeft size={15} /> Kembali
              </button>
            )}
            {last ? (
              <button className="btn-primary px-4 py-1.5" onClick={done}>
                Selesai
              </button>
            ) : (
              <button className="btn-primary px-4 py-1.5" onClick={() => setI((n) => n + 1)}>
                Lanjut <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
