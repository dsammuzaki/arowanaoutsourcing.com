-- =====================================================================
-- schema-8.sql — Alur kerja Task (ala monday.com / Jira)
-- Manajer+ membuat & meninjau; staf mengerjakan + upload hasil.
-- Aman dijalankan berulang.
-- =====================================================================

-- ---------- Kolom baru pada tabel tasks ----------
alter table tasks add column if not exists assignee_id uuid references profiles(id) on delete set null;
alter table tasks add column if not exists reviewer_id uuid references profiles(id) on delete set null;
alter table tasks add column if not exists result_note text;
alter table tasks add column if not exists result_url text;
alter table tasks add column if not exists submitted_at timestamptz;
alter table tasks add column if not exists reviewed_at timestamptz;
alter table tasks add column if not exists review_note text;
alter table tasks add column if not exists created_by uuid references profiles(id) on delete set null;

-- ---------- Storage: bucket untuk lampiran hasil task ----------
insert into storage.buckets (id, name, public)
values ('task-results', 'task-results', true)
on conflict (id) do nothing;

-- Kebijakan storage: baca publik (link bisa dibuka), tulis hanya user login.
drop policy if exists "task_results_read" on storage.objects;
create policy "task_results_read" on storage.objects
  for select using (bucket_id = 'task-results');

drop policy if exists "task_results_insert" on storage.objects;
create policy "task_results_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'task-results');

drop policy if exists "task_results_update" on storage.objects;
create policy "task_results_update" on storage.objects
  for update to authenticated using (bucket_id = 'task-results');

drop policy if exists "task_results_delete" on storage.objects;
create policy "task_results_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'task-results');
