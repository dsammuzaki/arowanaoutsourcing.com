-- =====================================================================
-- BSU — Goal KPI, Pipeline Kandidat, dan Log Aktivitas (audit)
-- Jalankan di Supabase SQL Editor.
-- =====================================================================

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  employee_id text references employees(id) on delete set null,
  employee_name text,
  due_date date,
  progress int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text,
  source text,
  score int not null default 70,
  stage text not null default 'Pelamar',
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  actor_role text,
  action text not null,
  target text,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists audit_created_idx on audit_log (created_at desc);

alter table goals enable row level security;
alter table candidates enable row level security;
alter table audit_log enable row level security;

drop policy if exists "goals read" on goals;
create policy "goals read" on goals for select to authenticated using (true);
drop policy if exists "goals write" on goals;
create policy "goals write" on goals for all to authenticated using (true) with check (true);

drop policy if exists "candidates read" on candidates;
create policy "candidates read" on candidates for select to authenticated using (true);
drop policy if exists "candidates write" on candidates;
create policy "candidates write" on candidates for all to authenticated using (true) with check (true);

-- audit_log: hanya bisa dibaca (penulisan lewat service key/admin)
drop policy if exists "audit read" on audit_log;
create policy "audit read" on audit_log for select to authenticated using (true);
