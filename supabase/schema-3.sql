-- =====================================================================
-- ABP — Skema Absensi GPS + Selfie (jalankan di Supabase SQL Editor)
-- =====================================================================

-- 1) Lokasi kerja (geofence) — absen hanya sah bila dalam radius lokasi ini
create table if not exists attendance_sites (
  id text primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  radius_m integer not null default 200,
  address text
);

-- 2) Catatan absensi
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id text references employees(id) on delete set null,
  employee_name text,
  recorded_by uuid,                                   -- akun (auth) yang mencatat
  kind text not null check (kind in ('masuk','pulang')),
  created_at timestamptz not null default now(),      -- WAKTU SERVER = sumber kebenaran
  captured_at timestamptz,                            -- waktu perangkat (audit)
  lat double precision,
  lng double precision,
  accuracy double precision,                          -- meter
  address text,
  selfie_url text,
  site_id text references attendance_sites(id) on delete set null,
  distance_m double precision,                        -- jarak ke lokasi terdekat
  status text not null default 'valid',               -- valid | diluar_area | akurasi_rendah | mencurigakan
  flags jsonb,                                        -- daftar sinyal keamanan
  user_agent text
);
create index if not exists attendance_created_idx on attendance (created_at desc);
create index if not exists attendance_emp_idx on attendance (employee_id, created_at desc);

-- 3) RLS — baca untuk yang login; penulisan lewat service key (bypass RLS)
alter table attendance_sites enable row level security;
alter table attendance enable row level security;

drop policy if exists "sites read" on attendance_sites;
create policy "sites read" on attendance_sites for select using (true);

drop policy if exists "attendance read" on attendance;
create policy "attendance read" on attendance for select using (true);

drop policy if exists "attendance insert" on attendance;
create policy "attendance insert" on attendance for insert to authenticated with check (true);

-- 4) Seed lokasi kantor pusat — GANTI koordinat & radius sesuai lokasi asli
insert into attendance_sites (id, name, lat, lng, radius_m, address) values
  ('hq', 'Kantor Pusat ABP', -6.2617, 107.0535, 300,
   'Ruko The East Point No.13, Tambun Selatan, Bekasi 17510')
on conflict (id) do nothing;
