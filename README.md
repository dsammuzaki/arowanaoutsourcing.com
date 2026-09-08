# ABP Outsourcing — Sistem Manajemen

Prototipe UI/UX Sistem Manajemen Outsourcing **PT. Arowana Bintang Perdana**.
Dibangun dengan **Next.js + Tailwind CSS**. Semua data masih contoh (mock) — belum
terhubung backend/database.

## Modul yang tersedia

| Modul | Halaman |
|---|---|
| Login | `/` |
| Dashboard (perbandingan per klien) | `/dashboard` |
| Data Induk Karyawan | `/karyawan` |
| Absensi | `/absensi` |
| Payroll & Slip Gaji (PPh 21, BPJS) | `/payroll`, `/payroll/[id]` |
| Pencairan Gaji (transfer + tunai) | `/pencairan` |
| Invoice Klien (Mgmt Fee, PPN, PPh 23) | `/invoice`, `/invoice/[id]` |
| Fee / Komisi Pihak Ketiga | `/fee` |
| Pengaturan Rate Pajak & BPJS | `/pengaturan` |

## Menjalankan di komputer

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Deploy ke Vercel

Lihat panduan langkah demi langkah di **DEPLOY.md**.

---
Palet warna & identitas mengikuti logo PT. Arowana Bintang Perdana
(teal `#1a7d9c`, emas `#c69a34`, deep teal-ink `#0a2029`).
