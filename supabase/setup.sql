-- =====================================================================
-- UCDA Bill of Sale — Supabase setup
-- Run this ONCE in Supabase: SQL Editor → New query → paste → Run
-- =====================================================================

-- ---------- SELLERS ----------
create table if not exists public.sellers (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  mvda_reg_number           text default '',
  address                   text default '',
  city_prov_pc              text default '',
  telephone                 text default '',
  fax                       text default '',
  salesperson_registration  text default '',
  salesperson_name          text default '',
  hst_registration          text default '',
  -- "/signatures/xxx.png" = file in the app's public folder
  -- anything else          = path inside the "signatures" storage bucket
  signature_path            text default '',
  created_at                timestamptz not null default now()
);

-- ---------- BILLS (history of every downloaded bill of sale) ----------
create table if not exists public.bills (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  created_by       uuid default auth.uid() references auth.users(id) on delete set null,
  created_by_email text default '',
  seller_id        uuid references public.sellers(id) on delete set null,
  seller_name      text default '',
  sale_date        date,
  purchaser_name   text default '',
  stock_number     text default '',
  vin              text default '',
  year             text default '',
  make             text default '',
  model            text default '',
  price            numeric(12,2) default 0,
  total            numeric(12,2) default 0,
  form_data        jsonb not null default '{}'::jsonb,  -- every form field
  seller_snapshot  jsonb not null default '{}'::jsonb,  -- seller details at time of sale
  pdf_path         text default ''                      -- path in "bills" storage bucket
);

create index if not exists bills_created_at_idx on public.bills (created_at desc);
create index if not exists bills_vin_idx        on public.bills (vin);

-- ---------- SECURITY: only logged-in users can read/write ----------
alter table public.sellers enable row level security;
alter table public.bills   enable row level security;

drop policy if exists "Logged-in users manage sellers" on public.sellers;
create policy "Logged-in users manage sellers" on public.sellers
  for all to authenticated using (true) with check (true);

drop policy if exists "Logged-in users manage bills" on public.bills;
create policy "Logged-in users manage bills" on public.bills
  for all to authenticated using (true) with check (true);

-- ---------- STORAGE (private buckets) ----------
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false),
       ('bills', 'bills', false)
on conflict (id) do nothing;

drop policy if exists "Logged-in read files"   on storage.objects;
drop policy if exists "Logged-in upload files" on storage.objects;
drop policy if exists "Logged-in update files" on storage.objects;
drop policy if exists "Logged-in delete files" on storage.objects;

create policy "Logged-in read files" on storage.objects
  for select to authenticated using (bucket_id in ('signatures', 'bills'));
create policy "Logged-in upload files" on storage.objects
  for insert to authenticated with check (bucket_id in ('signatures', 'bills'));
create policy "Logged-in update files" on storage.objects
  for update to authenticated using (bucket_id in ('signatures', 'bills'));
create policy "Logged-in delete files" on storage.objects
  for delete to authenticated using (bucket_id in ('signatures', 'bills'));

-- ---------- STARTING SELLERS (only added if the table is empty) ----------
insert into public.sellers
  (name, mvda_reg_number, address, city_prov_pc, telephone,
   salesperson_registration, salesperson_name, hst_registration, signature_path)
select * from (values
  ('16496351 Canada Inc.', '5873807', '3725 Lake Shore Blvd W', 'Etobicoke, Ontario, M8W 1P9',
   '647-608-4135', '5770995', 'DEEPIT SAJAN OOMMEN', '700404957RT0001',
   '/signatures/deepit-sajan-oommen.png'),
  ('ASYED AUTO SALES LTD', '5866991', '109-2829 DERRY RD E', 'Mississauga, Ontario, L4T 1A5',
   '647-762-6291', '5920756', 'RAJDEVINDER SINGH VAROWAL', '752404822RT0001',
   '/signatures/rajdevinder-singh-varowal.png')
) as v
where not exists (select 1 from public.sellers);
