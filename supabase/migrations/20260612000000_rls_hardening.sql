-- RLS hardening — 2026-06-12
-- Fixes: impersonation vectors, self-verify, self-publish, data room access

-- ─── 1. profiles: conversation participants can see each other ────────────────
-- Required for messaging UI (show seller/buyer name and avatar).
create policy "profiles_conversation_participant" on public.profiles
  for select
  using (
    id in (
      select seller_id from public.conversations where buyer_id  = auth.uid()
      union
      select buyer_id  from public.conversations where seller_id = auth.uid()
    )
  );

-- ─── 2. listings: prevent self-verify and self-publish on INSERT ──────────────
drop policy if exists "listings_seller_write" on public.listings;

create policy "listings_seller_insert" on public.listings
  for insert
  with check (
    seller_id = auth.uid()
    and verified = false
    and status in ('draft', 'pending_review')
  );

-- ─── 3. listings: trigger to guard admin-only fields on UPDATE ───────────────
-- Sellers cannot elevate verified, touch review metadata, or bypass review flow.
create or replace function public.guard_listing_sensitive_fields()
returns trigger language plpgsql as $$
begin
  if auth.uid() = old.seller_id then
    if new.verified <> old.verified then
      raise exception 'sellers cannot change the verified field';
    end if;
    if new.reviewed_at is distinct from old.reviewed_at then
      raise exception 'sellers cannot change reviewed_at';
    end if;
    if new.reviewed_by is distinct from old.reviewed_by then
      raise exception 'sellers cannot change reviewed_by';
    end if;
    -- Sellers may only move between draft ↔ pending_review; live/sold/under_offer are set by the platform.
    if new.status not in ('draft', 'pending_review') and new.status <> old.status then
      raise exception 'sellers cannot set status to %', new.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_guard_sensitive on public.listings;
create trigger listings_guard_sensitive
  before update on public.listings
  for each row execute function public.guard_listing_sensitive_fields();

-- ─── 4. conversations: split `for all` into granular policies ────────────────
-- Old policy allowed any user to INSERT claiming to be buyer OR seller.
drop policy if exists "conversations_access" on public.conversations;

-- Only participants may read their conversations.
create policy "conversations_select" on public.conversations
  for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Only the buyer may open a conversation (they set buyer_id = themselves).
create policy "conversations_insert" on public.conversations
  for insert
  with check (buyer_id = auth.uid());

-- Both participants may update (sign NDA, advance phase, etc.).
create policy "conversations_update" on public.conversations
  for update
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- ─── 5. messages: sender_id must match the authenticated user ────────────────
-- Old policy allowed any participant to send a message as another user.
drop policy if exists "messages_access" on public.messages;

create policy "messages_select" on public.messages
  for select
  using (
    conversation_id in (
      select id from public.conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );

create policy "messages_insert" on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and conversation_id in (
      select id from public.conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );

-- Participants may update messages (e.g. mark as read).
create policy "messages_update" on public.messages
  for update
  using (
    conversation_id in (
      select id from public.conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );

-- ─── 6. offers: only the buyer in the conversation may submit an offer ────────
drop policy if exists "offers_access" on public.offers;

create policy "offers_select" on public.offers
  for select
  using (
    conversation_id in (
      select id from public.conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );

-- Buyer_id must match auth.uid() AND the conversation must belong to them as buyer.
create policy "offers_insert" on public.offers
  for insert
  with check (
    buyer_id = auth.uid()
    and conversation_id in (
      select id from public.conversations where buyer_id = auth.uid()
    )
  );

-- Both participants may update (seller accepts/rejects, buyer withdraws).
create policy "offers_update" on public.offers
  for update
  using (
    conversation_id in (
      select id from public.conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );

-- ─── 7. storage: NDA-signed buyers can read seller documents (data room) ──────
-- Documents are stored at {seller_id}/{doc_type}/{filename} in listing-documents.
-- Grant read access to buyers who have a signed NDA for any of that seller's listings.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'listing_docs_nda_buyer_read' and tablename = 'objects'
  ) then
    execute $p$
      create policy "listing_docs_nda_buyer_read" on storage.objects
        for select
        using (
          bucket_id = 'listing-documents'
          and exists (
            select 1
            from public.ndas n
            join public.listings l on l.id = n.listing_id
            where n.buyer_id  = auth.uid()
              and n.status    = 'signed'
              and l.seller_id::text = (storage.foldername(name))[1]
          )
        )
    $p$;
  end if;
end $$;

-- ─── 8. listing-photos bucket: public read + seller-only write ───────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'listing_photos_upload' and tablename = 'objects') then
    execute $p$ create policy "listing_photos_upload" on storage.objects for insert with check (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]) $p$;
  end if;
  if not exists (select 1 from pg_policies where policyname = 'listing_photos_delete' and tablename = 'objects') then
    execute $p$ create policy "listing_photos_delete" on storage.objects for delete using (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]) $p$;
  end if;
end $$;
