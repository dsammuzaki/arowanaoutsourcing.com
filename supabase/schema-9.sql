-- =====================================================================
-- schema-9.sql — Komponen rekapitulasi pendapatan per karyawan per periode
-- Menyimpan komponen bulanan (Tambahan, Kompensasi, Rapel, Potongan,
-- Tunjangan, Hari kerja) yang dipakai tabel "Rekapitulasi Pendapatan".
-- Aman dijalankan berulang.
-- =====================================================================
create table if not exists recap_components (
  id uuid primary key default gen_random_uuid(),
  employee_id text references employees(id) on delete cascade,
  period text not null,               -- "YYYY-MM", mis. "2026-08"
  days int default 21,
  tambahan numeric not null default 0,
  kompensasi numeric not null default 0,
  rapel numeric not null default 0,
  pot_kedukaan numeric not null default 0,
  pot_koperasi numeric not null default 0,
  iph numeric not null default 0,     -- Izin Potong Upah / Potongan Perusahaan
  tunj_jabatan numeric not null default 0,
  tunj_kehadiran numeric not null default 0,
  tunj_equipment numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (employee_id, period)
);

create index if not exists recap_components_period_idx on recap_components (period);

alter table recap_components enable row level security;
drop policy if exists "recap read" on recap_components;
create policy "recap read" on recap_components
  for select to authenticated using (true);
-- Penulisan lewat service key (bypass RLS).
