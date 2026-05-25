-- SafeBusineSSSelling — Supabase schema
-- Run this in the Supabase SQL editor to set up the database.

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with extra info.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'buyer' check (role in ('buyer', 'seller', 'both')),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Listings ─────────────────────────────────────────────────────────────────
create table public.listings (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  sector        text not null,
  location      text not null,
  revenue       numeric(14, 2) not null,
  ebitda        numeric(14, 2) not null,
  asking_price  numeric(14, 2) not null,
  description   text,
  score         integer not null default 0 check (score between 0 and 100),
  verified      boolean not null default false,
  premium       boolean not null default false,
  status        text not null default 'draft'
                check (status in ('draft', 'pending_review', 'live', 'under_offer', 'sold')),
  photos        text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ─── Conversations ────────────────────────────────────────────────────────────
create table public.conversations (
  id                  uuid primary key default gen_random_uuid(),
  listing_id          uuid not null references public.listings(id) on delete cascade,
  buyer_id            uuid not null references public.profiles(id) on delete cascade,
  seller_id           uuid not null references public.profiles(id) on delete cascade,
  nda_signed_buyer    boolean not null default false,
  nda_signed_seller   boolean not null default false,
  status              text not null default 'active'
                      check (status in ('active', 'offer_made', 'closed', 'archived')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- ─── Messages ─────────────────────────────────────────────────────────────────
create table public.messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references public.conversations(id) on delete cascade,
  sender_id         uuid not null references public.profiles(id) on delete cascade,
  body              text not null,
  read              boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ─── Offers ───────────────────────────────────────────────────────────────────
create table public.offers (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references public.conversations(id) on delete cascade,
  buyer_id          uuid not null references public.profiles(id) on delete cascade,
  listing_id        uuid not null references public.listings(id) on delete cascade,
  amount            numeric(14, 2) not null,
  structure         text,
  message           text,
  status            text not null default 'pending'
                    check (status in ('pending', 'accepted', 'rejected', 'countered', 'withdrawn')),
  created_at        timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.listings      enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;
alter table public.offers        enable row level security;

-- Profiles: users can only see & edit their own
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Listings: live listings are public; sellers manage their own
create policy "listings_public_read"  on public.listings for select using (status = 'live' or seller_id = auth.uid());
create policy "listings_seller_write" on public.listings for insert with check (seller_id = auth.uid());
create policy "listings_seller_update" on public.listings for update using (seller_id = auth.uid());

-- Conversations: only participants can access
create policy "conversations_access" on public.conversations for all
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Messages: only participants of the conversation
create policy "messages_access" on public.messages for all
  using (
    conversation_id in (
      select id from public.conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );

-- Offers: only participants
create policy "offers_access" on public.offers for all
  using (
    conversation_id in (
      select id from public.conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime for the messaging system
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
