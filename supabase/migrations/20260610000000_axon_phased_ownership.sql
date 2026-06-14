-- Axon AI-COO knowledge transfer + phased ownership model

-- ─── Knowledge transfers (Axon AI-COO, required for deals > €100K) ───────────
create table if not exists public.knowledge_transfers (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  listing_id       uuid not null references public.listings(id) on delete cascade,
  seller_id        uuid not null references public.profiles(id) on delete cascade,
  buyer_id         uuid not null references public.profiles(id) on delete cascade,
  form             jsonb not null default '{}',
  status           text not null default 'draft'
                   check (status in ('draft', 'submitted', 'approved')),
  submitted_at     timestamptz,
  approved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (conversation_id)
);

create trigger knowledge_transfers_updated_at
  before update on public.knowledge_transfers
  for each row execute function public.set_updated_at();

alter table public.knowledge_transfers enable row level security;

create policy "knowledge_transfers_access" on public.knowledge_transfers for all
  using (
    conversation_id in (
      select id from public.conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );

-- ─── Deal agreements (phased ownership + dissolution clause) ─────────────────
create table if not exists public.deal_agreements (
  id                       uuid primary key default gen_random_uuid(),
  conversation_id          uuid not null references public.conversations(id) on delete cascade,
  status                   text not null default 'draft'
                           check (status in ('draft', 'active', 'completed', 'dissolved')),
  dissolution_clause       text not null default 'Either party may dissolve this agreement in writing during any phase before full ownership transfer. Upon dissolution, ownership reverts to the percentages of the last completed phase, escrowed funds for uncompleted phases are returned to the buyer, and the seller regains operational control. Both parties remain bound by confidentiality.',
  dissolution_notice_days  integer not null default 30 check (dissolution_notice_days >= 0),
  dissolution_reason       text,
  dissolved_at             timestamptz,
  buyer_signed_at          timestamptz,
  seller_signed_at         timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (conversation_id)
);

create trigger deal_agreements_updated_at
  before update on public.deal_agreements
  for each row execute function public.set_updated_at();

alter table public.deal_agreements enable row level security;

create policy "deal_agreements_access" on public.deal_agreements for all
  using (
    conversation_id in (
      select id from public.conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );

-- ─── Deal agreement phases (configurable ownership percentages) ──────────────
create table if not exists public.deal_agreement_phases (
  id                    uuid primary key default gen_random_uuid(),
  agreement_id          uuid not null references public.deal_agreements(id) on delete cascade,
  position              integer not null check (position >= 1),
  title                 text not null,
  description           text,
  ownership_percentage  numeric(5, 2) not null
                        check (ownership_percentage >= 0 and ownership_percentage <= 100),
  status                text not null default 'pending'
                        check (status in ('pending', 'active', 'completed')),
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  unique (agreement_id, position)
);

alter table public.deal_agreement_phases enable row level security;

create policy "deal_agreement_phases_access" on public.deal_agreement_phases for all
  using (
    agreement_id in (
      select id from public.deal_agreements
      where conversation_id in (
        select id from public.conversations
        where buyer_id = auth.uid() or seller_id = auth.uid()
      )
    )
  );
