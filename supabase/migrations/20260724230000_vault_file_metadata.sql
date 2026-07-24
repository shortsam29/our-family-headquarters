-- Complete Family Vault file metadata required by the secure upload flow.
-- Forward-only and non-destructive.

alter table public.vault_documents
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint check (file_size is null or file_size between 0 and 20971520);

create index if not exists vault_documents_household_file_name_idx
  on public.vault_documents(household_id, file_name)
  where archived_at is null;
