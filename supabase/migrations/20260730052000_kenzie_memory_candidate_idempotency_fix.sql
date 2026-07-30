-- The original memory migration named the message-only index
-- kenzie_personal_memories_source_once_idx. Remove it now that candidate-level
-- idempotency is enforced.
drop index if exists public.kenzie_personal_memories_source_once_idx;
