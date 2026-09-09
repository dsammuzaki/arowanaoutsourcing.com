-- =====================================================================
-- ABP Outsourcing — Skema Database (Supabase / PostgreSQL)
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query ->
-- tempel SELURUH isi file ini -> Run.
-- Aman dijalankan ulang (idempotent).
-- =====================================================================

-- ---------- ENUM ----------
do $$ begin create type user_role as enum ('super_admin','operation','director','finance');
exception when duplicate_object then null; end $$;
do $$ begin create type contract_type as enum ('staff','security','cleaning','driver');
exception when duplicate_object then null; end $$;
do $$ begin create type contract_status as enum ('aktif','segera_berakhir','berakhir');
exception when duplicate_object then null; end $$;
do $$ begin create type leave_status as enum ('pending','disetujui','ditolak');
exception when duplicate_object then null; end $$;
do $$ begin create type task_priority as enum ('rendah','sedang','tinggi','urgent');
exception when duplicate_object then null; end $$;
do $$ begin create type approval_status as enum ('draft','menunggu','disetujui','ditolak');
exception when duplicate_object then null; end $$;

-- ---------- PROFILES (1:1 dengan auth.users) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role user_role not null default 'operation',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Buat profil otomatis saat user auth dibuat
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''),
          coalesce((new.raw_user_meta_data->>'role')::user_role,'operation'))
  on conflict (id) do nothing;
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- CLIENTS ----------
create table if not exists clients (
  id text primary key,
  name text not null,
  entity_id text,
  contract_type contract_type not null,
  headcount int not null default 0,
  management_fee_pct numeric not null default 0,
  ppn_pct numeric not null default 12,
  pph23_pct numeric not null default 2,
  spk_number text,
  period_start date,
  period_end date
);

-- ---------- EMPLOYEES ----------
create table if not exists employees (
  id text primary key,
  nik text unique not null,
  name text not null,
  gender text check (gender in ('L','P')) default 'L',
  position text,
  client_id text references clients(id) on delete set null,
  contract_type contract_type,
  branch text,
  marital_status text check (marital_status in ('K','TK')) default 'TK',
  dependents int not null default 0,
  npwp text,
  bank_name text,
  bank_account text,
  join_date date,
  exit_date date,
  basic_salary numeric not null default 0,
  status text check (status in ('aktif','keluar')) default 'aktif',
  photo_url text,
  created_at timestamptz not null default now()
);

-- ---------- CONTRACTS ----------
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  employee_id text references employees(id) on delete cascade,
  number text,
  type contract_type,
  start_date date,
  end_date date,
  term_months int,
  status contract_status default 'aktif'
);

-- ---------- LEAVE ----------
create table if not exists leave_applications (
  id uuid primary key default gen_random_uuid(),
  employee_id text references employees(id) on delete cascade,
  type text,
  start_date date,
  end_date date,
  days int,
  reason text,
  status leave_status default 'pending',
  created_at timestamptz not null default now()
);

-- ---------- PROJECTS & TASKS ----------
create table if not exists projects (
  id text primary key,
  name text not null,
  color text default '#1a7d9c',
  owner text,
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id text references projects(id) on delete cascade,
  title text not null,
  description text default '',
  column_key text default 'todo',
  priority task_priority default 'sedang',
  assignee text,
  due_date date,
  checklist_done int default 0,
  checklist_total int default 0,
  comments int default 0,
  approval_status approval_status default 'draft',
  approver text,
  created_at timestamptz not null default now()
);

-- ---------- RLS (kebijakan awal untuk pengembangan) ----------
-- Baca: publik (agar app bisa tampil). Tulis: hanya user login.
-- Nanti diperketat per-role saat login sudah aktif.
do $$
declare t text;
begin
  foreach t in array array['clients','employees','contracts','leave_applications','projects','tasks','profiles']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "read_all_%1$s" on %1$I;', t);
    execute format('create policy "read_all_%1$s" on %1$I for select using (true);', t);
    execute format('drop policy if exists "write_auth_%1$s" on %1$I;', t);
    execute format('create policy "write_auth_%1$s" on %1$I for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ---------- SEED (contoh awal, aman diulang) ----------
insert into clients (id,name,entity_id,contract_type,headcount,management_fee_pct,spk_number,period_start,period_end) values
 ('als','PT. Armas Logistic Service','abp','staff',42,7,'SPK/ALS/2026/0142','2026-01-01','2026-12-31'),
 ('dpm','PT BPR DPM Kredit Mandiri','cpp','security',18,8,'SPK/DPM/2026/0088','2026-03-01','2027-02-28'),
 ('mkw','PT. Mega Karya Wijaya','abp','cleaning',25,7,'SPK/MKW/2026/0201','2026-02-01','2027-01-31'),
 ('snt','PT. Sentosa Niaga Transport','abp','driver',14,7.5,'SPK/SNT/2026/0173','2026-01-15','2026-12-31')
on conflict (id) do nothing;

insert into projects (id,name,color,owner,due_date) values
 ('pg-1','Rekrutmen Security DPM','#1a7d9c','Mariyanti','2026-09-30'),
 ('pg-2','Payroll & Invoice Agustus','#c69a34','Deo Galuh','2026-09-15'),
 ('pg-3','Onboarding Batch September','#8b5cf6','Tri Antoro','2026-09-25')
on conflict (id) do nothing;
