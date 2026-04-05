-- Qairos initial schema
-- Creates all tables used by the app, with foreign keys between related entities.

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── team ────────────────────────────────────────────────────────────────────
create table if not exists public.team (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  role text,
  commission_split numeric,
  start_date date,
  contract_type text,
  active boolean default true,
  created_at timestamptz default now()
);

-- ─── creators ────────────────────────────────────────────────────────────────
create table if not exists public.creators (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  handle text,
  email text,
  phone text,
  location text,
  bio text,
  profile_photo text,
  primary_platform text,
  platforms jsonb,
  strongest_channels jsonb,
  niche jsonb,
  contract_type text,
  commission_rate numeric,
  status text,
  assigned_manager_id uuid references public.team(id) on delete set null,
  signed_date date,
  notes text,
  created_at timestamptz default now()
);

-- ─── rate_cards ──────────────────────────────────────────────────────────────
create table if not exists public.rate_cards (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  platform text,
  content_type text,
  rate numeric,
  notes text
);

-- ─── agencies ────────────────────────────────────────────────────────────────
create table if not exists public.agencies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text,
  website text,
  primary_contact_id uuid,
  notes text,
  created_at timestamptz default now()
);

-- ─── brands ──────────────────────────────────────────────────────────────────
create table if not exists public.brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  website text,
  niche text,
  billing_name text,
  billing_address text,
  billing_email text,
  tax_id text,
  primary_contact_id uuid,
  agency_id uuid references public.agencies(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- ─── contacts ────────────────────────────────────────────────────────────────
create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  first_name text,
  last_name text,
  email text,
  phone text,
  role text,
  brand_id uuid references public.brands(id) on delete set null,
  agency_id uuid references public.agencies(id) on delete set null,
  created_at timestamptz default now()
);

-- Backfill primary_contact FKs on brands & agencies (deferred via alter)
alter table public.brands
  add constraint brands_primary_contact_fk
  foreign key (primary_contact_id) references public.contacts(id) on delete set null
  deferrable initially deferred;

alter table public.agencies
  add constraint agencies_primary_contact_fk
  foreign key (primary_contact_id) references public.contacts(id) on delete set null
  deferrable initially deferred;

-- ─── deals ───────────────────────────────────────────────────────────────────
create table if not exists public.deals (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  manager_id uuid references public.team(id) on delete set null,
  deal_name text,
  status text,
  total_value numeric,
  commission_rate numeric,
  payment_terms text,
  type text,
  is_rebook boolean default false,
  previous_deal_id uuid references public.deals(id) on delete set null,
  signed_date date,
  notes text,
  created_at timestamptz default now()
);

-- ─── deal_deliverables ───────────────────────────────────────────────────────
create table if not exists public.deal_deliverables (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  platform text,
  content_type text,
  quantity integer default 1,
  rate numeric,
  month text,
  subtotal numeric
);

-- ─── campaigns ───────────────────────────────────────────────────────────────
create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references public.deals(id) on delete set null,
  creator_id uuid references public.creators(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  manager_id uuid references public.team(id) on delete set null,
  platform text,
  content_type text,
  amount numeric,
  status text,
  approval_required boolean default true,
  approval_waived boolean default false,
  preview_due date,
  live_date date,
  followup_date date,
  payment_due date,
  brief_url text,
  content_url text,
  checklist jsonb,
  notes text,
  created_at timestamptz default now()
);

-- ─── contracts ───────────────────────────────────────────────────────────────
create table if not exists public.contracts (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references public.deals(id) on delete set null,
  creator_id uuid references public.creators(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  manager_id uuid references public.team(id) on delete set null,
  status text,
  generated_at timestamptz,
  signed_at timestamptz,
  file_url text,
  ai_generated boolean default false,
  created_at timestamptz default now()
);

-- ─── invoices ────────────────────────────────────────────────────────────────
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  billing_name text,
  billing_address text,
  billing_email text,
  amount numeric,
  due_date date,
  status text,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ─── payouts ─────────────────────────────────────────────────────────────────
create table if not exists public.payouts (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  creator_id uuid references public.creators(id) on delete set null,
  gross_amount numeric,
  commission_amount numeric,
  net_amount numeric,
  status text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ─── campaign_stats ──────────────────────────────────────────────────────────
create table if not exists public.campaign_stats (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  views bigint,
  reach bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  link_clicks bigint,
  ctr numeric,
  cvr numeric,
  revenue_generated numeric,
  roi numeric,
  engagement_rate numeric
);

-- ─── expenses ────────────────────────────────────────────────────────────────
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  name text,
  amount numeric,
  date date,
  category text,
  deal_id uuid references public.deals(id) on delete set null,
  receipt_url text,
  manager_id uuid references public.team(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- ─── tasks ───────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  status text,
  priority text,
  assigned_to uuid references public.team(id) on delete set null,
  due_date date,
  recurring text,
  link_type text,
  link_id uuid,
  tags jsonb,
  notes text,
  created_at timestamptz default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_creators_status on public.creators(status);
create index if not exists idx_deals_creator on public.deals(creator_id);
create index if not exists idx_deals_status on public.deals(status);
create index if not exists idx_campaigns_creator on public.campaigns(creator_id);
create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_campaigns_live_date on public.campaigns(live_date);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_due_date on public.invoices(due_date);
create index if not exists idx_payouts_status on public.payouts(status);
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_expenses_date on public.expenses(date);
