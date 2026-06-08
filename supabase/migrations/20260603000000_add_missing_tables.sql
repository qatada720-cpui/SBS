-- Add missing columns to listings
alter table public.listings
  add column if not exists founded integer,
  add column if not exists employees integer,
  add column if not exists rejection_reason text,
  add column if not exists phases jsonb,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid;

-- Add 'rejected' to listings status check
alter table public.listings
  drop constraint if exists listings_status_check;

alter table public.listings
  add constraint listings_status_check
  check (status in ('draft', 'pending_review', 'live', 'under_offer', 'sold', 'rejected'));

-- ─── Saved Listings ───────────────────────────────────────────────────────────
create table if not exists public.saved_listings (
  id          uuid primary key default gen_random_uuid(),
  buyer_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (buyer_id, listing_id)
);

alter table public.saved_listings enable row level security;

create policy "saved_listings_access" on public.saved_listings for all
  using (buyer_id = auth.uid());

-- ─── NDAs ─────────────────────────────────────────────────────────────────────
create table if not exists public.ndas (
  id          uuid primary key default gen_random_uuid(),
  buyer_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  status      text not null default 'pending'
              check (status in ('pending', 'signed', 'rejected')),
  created_at  timestamptz not null default now(),
  unique (buyer_id, listing_id)
);

alter table public.ndas enable row level security;

create policy "ndas_buyer_access" on public.ndas for all
  using (buyer_id = auth.uid());

create policy "ndas_seller_read" on public.ndas for select
  using (
    listing_id in (
      select id from public.listings where seller_id = auth.uid()
    )
  );
