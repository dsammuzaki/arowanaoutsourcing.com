-- =====================================================================
-- ABP/BSU — Role baru (HR/PIC, Customer) + tabel persetujuan perubahan
-- Jalankan di Supabase SQL Editor.
-- =====================================================================

-- 1) Tambah role baru ke enum user_role
alter type user_role add value if not exists 'hr_pic';
alter type user_role add value if not exists 'customer';

-- 2) Tabel permintaan perubahan (edit oleh HR/PIC & Customer perlu approval)
create table if not exists change_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid,
  requester_name text,
  requester_role text,
  kind text not null,                 -- mis. 'karyawan'
  target_id text,                     -- id entitas yang diubah
  target_label text,                  -- nama entitas (untuk tampilan)
  payload jsonb not null,             -- field yang diminta berubah
  note text,
  status text not null default 'pending',  -- pending | disetujui | ditolak
  reviewed_by uuid,
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists change_requests_status_idx on change_requests (status, created_at desc);

alter table change_requests enable row level security;
drop policy if exists "cr read" on change_requests;
create policy "cr read" on change_requests for select using (true);
drop policy if exists "cr insert" on change_requests;
create policy "cr insert" on change_requests for insert to authenticated with check (true);
