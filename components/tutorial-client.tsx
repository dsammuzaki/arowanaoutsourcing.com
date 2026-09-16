"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Building2,
  Users,
  CalendarCheck,
  SquareKanban,
  Wallet,
  Banknote,
  FileText,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

type Step = { text: string; cta?: { label: string; href: string } };
type Module = { id: string; title: string; Icon: LucideIcon; intro: string; steps: Step[] };

const MODULES: Module[] = [
  {
    id: "siap",
    title: "Persiapan awal (Super Admin)",
    Icon: ShieldCheck,
    intro: "Lakukan sekali agar akun tim & perhitungan siap dipakai.",
    steps: [
      { text: "Buka Manajemen Akun, klik “Tambah Akun”, buat 1 akun untuk rekan tim dan pilih perannya (mis. Finance).", cta: { label: "Buka Manajemen Akun", href: "/akun" } },
      { text: "Buka Pengaturan, periksa tarif PPh 21 & BPJS, lalu klik Simpan. Nilai ini dipakai payroll.", cta: { label: "Buka Pengaturan", href: "/pengaturan" } },
    ],
  },
  {
    id: "pelanggan",
    title: "Tambah pelanggan pertama",
    Icon: Building2,
    intro: "Pelanggan (klien) adalah tempat karyawan ditempatkan & ditagih.",
    steps: [
      { text: "Buka Data Pelanggan, klik “Tambah Pelanggan”.", cta: { label: "Buka Data Pelanggan", href: "/pelanggan" } },
      { text: "Isi nama, badan usaha, jenis tenaga kerja, headcount, Management Fee %, PPN %, PPh 23 %, No. SPK, periode → klik Simpan." },
      { text: "Pastikan pelanggan baru muncul di tabel. Coba klik pensil untuk mengedit." },
    ],
  },
  {
    id: "karyawan",
    title: "Tambah / lihat karyawan",
    Icon: Users,
    intro: "Data induk karyawan dipakai payroll, absensi, kontrak, BPJS.",
    steps: [
      { text: "Buka Data Karyawan. Lihat daftar 48 karyawan (data ARMAS).", cta: { label: "Buka Data Karyawan", href: "/karyawan" } },
      { text: "Klik salah satu nama untuk membuka detail (kontrak, gaji, absensi).", },
      { text: "Untuk menambah, gunakan tombol “Tambah Karyawan” dan lengkapi NIK, jabatan, bank & rekening, gaji pokok." },
    ],
  },
  {
    id: "absensi",
    title: "Catat absensi",
    Icon: CalendarCheck,
    intro: "Absen berbasis GPS; rekap otomatis masuk sistem.",
    steps: [
      { text: "Buka Absensi. Pilih karyawan, izinkan lokasi, lalu klik Masuk / Pulang.", cta: { label: "Buka Absensi", href: "/absensi" } },
      { text: "Lihat log absensi terkini muncul dengan waktu & lokasi." },
    ],
  },
  {
    id: "task",
    title: "Buat & tinjau Task",
    Icon: SquareKanban,
    intro: "Alur: manajer buat → staf kerjakan & unggah hasil → ditinjau.",
    steps: [
      { text: "Buka Task. Sebagai manajer, klik “Task Baru”, tugaskan ke seorang staf, pilih peninjau.", cta: { label: "Buka Task", href: "/proyek" } },
      { text: "Sebagai staf: buka task Anda, isi keterangan hasil + unggah file, klik “Kirim untuk Ditinjau”." },
      { text: "Sebagai peninjau: buka task menunggu, klik Setujui / Tolak (beri catatan)." },
    ],
  },
  {
    id: "payroll",
    title: "Jalankan Payroll & Rekap",
    Icon: Wallet,
    intro: "Transaksi inti: hitung gaji & rekap pendapatan per pelanggan.",
    steps: [
      { text: "Buka Payroll & Slip Gaji. Pilih Periode (mis. Agustus 2026) & pelanggan.", cta: { label: "Buka Payroll", href: "/payroll" } },
      { text: "Di tab Slip Gaji, ubah kolom “Hari Kerja” bila perlu untuk prorata." },
      { text: "Buka tab “Rekapitulasi Pendapatan”. Klik pensil (kanan) pada 1 karyawan, isi komponen, Simpan → lihat Grand Total berubah." },
      { text: "Coba Export (Excel), ubah 1 angka di Excel, lalu Import → cek pratinjau → Konfirmasi." },
      { text: "Klik “Lihat” pada seorang karyawan, lalu Unduh PDF slip gaji (rapi ukuran A4)." },
    ],
  },
  {
    id: "bayar",
    title: "Pencairan & tagihan",
    Icon: Banknote,
    intro: "Setelah payroll final: cairkan gaji dan tagih pelanggan.",
    steps: [
      { text: "Buka Pencairan Gaji, lihat batch transfer per bank (Mandiri/BCA/BRI/BSI).", cta: { label: "Buka Pencairan", href: "/pencairan" } },
      { text: "Buka BPJS untuk memantau iuran & peserta.", cta: { label: "Buka BPJS", href: "/bpjs" } },
      { text: "Buka Invoice Klien, terbitkan tagihan ke pelanggan, lalu tandai statusnya (Terkirim/Dibayar).", cta: { label: "Buka Invoice", href: "/invoice" } },
    ],
  },
  {
    id: "profil",
    title: "Edit profil & akun",
    Icon: UserCircle,
    intro: "Mengatur akun Anda sendiri.",
    steps: [
      { text: "Klik foto/inisial Anda di pojok kanan atas → menu akun terbuka." },
      { text: "Ubah nama, atur ulang kata sandi, atau ganti akun dari menu itu." },
      { text: "Ganti tema terang/gelap lewat ikon bulan/matahari di bilah atas." },
    ],
  },
];

const KEY = "bsu_tutorial_done_v1";

export function TutorialClient() {
  const total = useMemo(() => MODULES.reduce((n, m) => n + m.steps.length, 0), []);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<string | null>(MODULES[0].id);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {}
  }, []);

  function toggle(id: string) {
    setDone((d) => {
      const next = { ...d, [id]: !d[id] };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const doneCount = Object.values(done).filter(Boolean).length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="font-bold text-foreground">Progres Anda</p>
              <p className="text-xs text-muted-foreground">
                {doneCount} dari {total} langkah selesai
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold text-primary">{pct}%</span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Ikuti tiap modul berurutan. Klik <span className="font-semibold text-foreground">Buka</span> untuk melakukan
          transaksinya langsung, lalu centang <span className="font-semibold text-foreground">Selesai</span>.
        </p>
      </Card>

      {/* Modules */}
      {MODULES.map((m, mi) => {
        const stepIds = m.steps.map((_, i) => `${m.id}-${i}`);
        const mDone = stepIds.filter((id) => done[id]).length;
        const complete = mDone === m.steps.length;
        const isOpen = open === m.id;
        return (
          <Card key={m.id} className="overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : m.id)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  complete ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/10 text-primary"
                }`}
              >
                {complete ? <CheckCircle2 size={21} /> : <m.Icon size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-bold text-foreground">
                  <span className="text-xs font-semibold text-muted-foreground">Modul {mi + 1}</span>
                  {m.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.intro}</p>
              </div>
              <span className="hidden shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground sm:block">
                {mDone}/{m.steps.length}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="border-t border-border">
                {m.steps.map((s, i) => {
                  const id = `${m.id}-${i}`;
                  const checked = !!done[id];
                  return (
                    <div key={id} className="flex items-start gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
                      <button
                        onClick={() => toggle(id)}
                        className={`mt-0.5 shrink-0 ${checked ? "text-emerald-600" : "text-muted-foreground hover:text-primary"}`}
                        aria-label={checked ? "Tandai belum selesai" : "Tandai selesai"}
                      >
                        {checked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          <span className="mr-1.5 font-semibold text-primary">{mi + 1}.{i + 1}</span>
                          {s.text}
                        </p>
                        {s.cta && (
                          <Link
                            href={s.cta.href}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                          >
                            {s.cta.label} <ArrowRight size={13} />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      {doneCount === total && (
        <Card className="flex items-center gap-3 border-emerald-300/60 bg-emerald-50 p-5 dark:border-emerald-800/50 dark:bg-emerald-950/30">
          <CheckCircle2 className="text-emerald-600" size={26} />
          <div>
            <p className="font-bold text-foreground">Selamat! Semua modul selesai 🎉</p>
            <p className="text-sm text-muted-foreground">Anda sudah menguasai alur operasi sistem BSU dari nol sampai pembayaran.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
