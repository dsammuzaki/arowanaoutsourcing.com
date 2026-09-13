-- =====================================================================
-- BSU — Chat antar anggota tim (messages) + realtime
-- Jalankan di Supabase SQL Editor.
-- =====================================================================

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null,
  from_name text,
  to_id uuid not null,
  to_name text,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_to_idx on messages (to_id, created_at desc);
create index if not exists messages_pair_idx on messages (from_id, to_id, created_at);

alter table messages enable row level security;

-- Hanya boleh membaca pesan yang melibatkan diri sendiri
drop policy if exists "messages read" on messages;
create policy "messages read" on messages
  for select to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);

-- Mengirim: pengirim harus diri sendiri
drop policy if exists "messages insert" on messages;
create policy "messages insert" on messages
  for insert to authenticated
  with check (auth.uid() = from_id);

-- Menandai dibaca: hanya penerima
drop policy if exists "messages update" on messages;
create policy "messages update" on messages
  for update to authenticated
  using (auth.uid() = to_id)
  with check (auth.uid() = to_id);

-- Aktifkan realtime (aman bila sudah ada)
do $$
begin
  begin
    alter publication supabase_realtime add table messages;
  exception when duplicate_object then null; when others then null;
  end;
end $$;
