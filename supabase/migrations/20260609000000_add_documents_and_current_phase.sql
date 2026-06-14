-- Add documents jsonb to listings for storing uploaded file storage paths
alter table public.listings
  add column if not exists documents jsonb;

-- Add current_phase to conversations for deal progress tracking
alter table public.conversations
  add column if not exists current_phase integer not null default 1;

-- Create private storage bucket for listing documents (50MB limit)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-documents',
  'listing-documents',
  false,
  52428800,
  array['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Storage RLS: sellers can upload/read/delete their own documents
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'listing_docs_upload' and tablename = 'objects') then
    execute $p$ create policy "listing_docs_upload" on storage.objects for insert with check (bucket_id = 'listing-documents' and auth.uid()::text = (storage.foldername(name))[1]) $p$;
  end if;
  if not exists (select 1 from pg_policies where policyname = 'listing_docs_owner_read' and tablename = 'objects') then
    execute $p$ create policy "listing_docs_owner_read" on storage.objects for select using (bucket_id = 'listing-documents' and auth.uid()::text = (storage.foldername(name))[1]) $p$;
  end if;
  if not exists (select 1 from pg_policies where policyname = 'listing_docs_delete' and tablename = 'objects') then
    execute $p$ create policy "listing_docs_delete" on storage.objects for delete using (bucket_id = 'listing-documents' and auth.uid()::text = (storage.foldername(name))[1]) $p$;
  end if;
end $$;
