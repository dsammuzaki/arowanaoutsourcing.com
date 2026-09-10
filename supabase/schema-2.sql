-- =====================================================================
-- ABP — Skema tambahan: Lowongan, Invoice, Fee/Komisi
-- Supabase -> SQL Editor -> tempel semua -> Run. Aman diulang.
-- =====================================================================

-- ---------- JOB POSTINGS (Lowongan) ----------
create table if not exists job_postings (
  id text primary key,
  title text not null,
  client_id text references clients(id) on delete set null,
  type contract_type,
  location text,
  applicants int not null default 0,
  target int not null default 1,
  status text not null default 'dibuka',
  posted date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- INVOICES ----------
create table if not exists invoices (
  id text primary key,
  number text not null,
  client_id text references clients(id) on delete set null,
  entity_prefix text,
  period text,
  salary_subtotal numeric not null default 0,
  bpjs_client numeric not null default 0,
  management_fee numeric not null default 0,
  dpp numeric not null default 0,
  ppn numeric not null default 0,
  total numeric not null default 0,
  pph23 numeric not null default 0,
  grand_total numeric not null default 0,
  status text not null default 'draft',
  due_date date,
  created_at timestamptz not null default now()
);

-- ---------- REFERRAL FEES (Fee/Komisi) ----------
create table if not exists referral_fees (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  client_id text references clients(id) on delete set null,
  period text,
  base numeric not null default 0,
  fee_pct numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['job_postings','invoices','referral_fees']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "read_all_%1$s" on %1$I;', t);
    execute format('create policy "read_all_%1$s" on %1$I for select using (true);', t);
    execute format('drop policy if exists "write_auth_%1$s" on %1$I;', t);
    execute format('create policy "write_auth_%1$s" on %1$I for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ---------- SEED ----------
insert into job_postings (id,title,client_id,type,location,applicants,target,status,posted) values
 ('job-1','Security / Anggota','dpm','security','Bekasi',24,6,'dibuka','2026-08-01'),
 ('job-2','Office Boy','als','staff','Cikarang',18,4,'dibuka','2026-08-05'),
 ('job-3','Cleaning Service','mkw','cleaning','Jakarta Timur',31,8,'dibuka','2026-08-08'),
 ('job-4','Driver Sedang','snt','driver','Karawang',12,3,'ditutup','2026-07-20'),
 ('job-5','Staff CCR','als','staff','Cikarang',9,2,'draft','2026-08-18')
on conflict (id) do nothing;

insert into invoices (id,number,client_id,entity_prefix,period,salary_subtotal,bpjs_client,management_fee,dpp,ppn,total,pph23,grand_total,status,due_date) values
 ('inv-als-141','ABP/INV/2026/0141','als','ABP','Agustus 2026',205124273,21004726,15828930,241957929,29034951,270992880,316579,270676301,'dibayar','2026-09-25'),
 ('inv-dpm-142','CPP/INV/2026/0142','dpm','CPP','Agustus 2026',93000000,9523200,8201856,110725056,13287007,124012063,164037,123848026,'terkirim','2026-09-25'),
 ('inv-mkw-143','ABP/INV/2026/0143','mkw','ABP','Agustus 2026',120000000,12288000,9260160,141548160,16985779,158533939,185203,158348736,'jatuh_tempo','2026-09-25'),
 ('inv-snt-144','ABP/INV/2026/0144','snt','ABP','Agustus 2026',73400000,7516160,6068712,86984872,10438185,97423057,121374,97301683,'draft','2026-09-25')
on conflict (id) do nothing;

insert into referral_fees (recipient,client_id,period,base,fee_pct,total,status) values
 ('Bpk. Adang Suryana','als','Agustus 2026',15512351,8,1240988,'dibayar'),
 ('Bpk. Hermawan','dpm','Agustus 2026',8037819,5,401891,'pending')
on conflict do nothing;
