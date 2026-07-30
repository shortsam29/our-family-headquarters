-- Allow one conversation message to produce multiple distinct, idempotent
-- memory candidates while still preventing duplicate retries.
drop index if exists public.kenzie_personal_memories_source_once_idx;

create unique index if not exists kenzie_personal_memories_source_candidate_uidx
  on public.kenzie_personal_memories (
    household_id,
    owner_family_member_id,
    source_message_id,
    category,
    subject
  )
  where source_message_id is not null;
