-- =====================================================================
-- BSU — Pembatasan data per-Customer (RLS) + tabel pengaturan
-- Jalankan di Supabase SQL Editor.
-- =====================================================================

-- 1) Kolom klien untuk akun (khusus role Customer -> hanya lihat kliennya)
alter table profiles add column if not exists client_id text references clients(id) on delete set null;

-- 2) RLS data karyawan: hanya untuk yang login; Customer hanya karyawan kliennya.
--    (Hapus semua policy lama di tabel employees agar tidak ada yang permisif.)
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'employees' loop
    execute format('drop policy if exists %I on public.employees', pol.policyname);
  end loop;
end $$;

create policy "employees scoped read" on employees
  for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.role <> 'customer' or p.client_id = employees.client_id)
    )
  );
-- (Penulisan employees tetap lewat service key/admin yang bypass RLS.)

-- 3) Perketat baca: blokir akses anonim (harus login)
drop policy if exists "attendance read" on attendance;
create policy "attendance read" on attendance for select to authenticated using (true);

drop policy if exists "cr read" on change_requests;
create policy "cr read" on change_requests for select to authenticated using (true);

-- 4) Tabel pengaturan aplikasi (tarif PPh 21 & BPJS, badan usaha)
create table if not exists app_settings (
  id int primary key default 1,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table app_settings enable row level security;
drop policy if exists "settings read" on app_settings;
create policy "settings read" on app_settings for select to authenticated using (true);
