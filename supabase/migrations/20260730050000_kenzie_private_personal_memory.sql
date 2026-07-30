create table if not exists public.kenzie_memory_settings (
  household_id uuid not null,
  owner_family_member_id uuid not null,
  automatic_memory_enabled boolean not null default true,
  first_use_notice_acknowledged_at timestamptz,
  paused_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id, owner_family_member_id),
  foreign key (household_id, owner_family_member_id)
    references public.family_members(household_id, id) on delete cascade
);

create table if not exists public.kenzie_personal_memories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  owner_family_member_id uuid not null,
  category text not null check (category in (
    'preference', 'dislike', 'communication_preference', 'learning_preference',
    'reminder_preference', 'routine', 'hobby', 'favorite', 'personal_context',
    'accessibility_preference', 'relationship_context', 'temporary_context'
  )),
  subject text not null check (char_length(subject) between 1 and 120),
  normalized_value text not null check (char_length(normalized_value) between 1 and 240),
  display_text text not null check (char_length(display_text) between 1 and 500),
  confidence text not null check (confidence in ('high', 'medium')),
  sensitivity text not null default 'low' check (sensitivity in ('low', 'moderate')),
  durability text not null check (durability in ('durable', 'temporary')),
  status text not null default 'active' check (status in ('active', 'superseded', 'deleted')),
  source_type text not null default 'conversation' check (source_type in ('conversation', 'user_edit')),
  source_conversation_id uuid,
  source_message_id uuid,
  first_observed_at timestamptz not null default now(),
  last_observed_at timestamptz not null default now(),
  expires_at timestamptz,
  superseded_by uuid references public.kenzie_personal_memories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (household_id, owner_family_member_id)
    references public.family_members(household_id, id) on delete cascade,
  check (
    (durability = 'temporary' and expires_at is not null)
    or (durability = 'durable' and expires_at is null)
  )
);

create unique index if not exists kenzie_personal_memories_source_once_idx
  on public.kenzie_personal_memories(household_id, owner_family_member_id, source_message_id)
  where source_message_id is not null;
create unique index if not exists kenzie_personal_memories_active_subject_idx
  on public.kenzie_personal_memories(household_id, owner_family_member_id, category, subject)
  where status = 'active' and deleted_at is null;
create index if not exists kenzie_personal_memories_owner_updated_idx
  on public.kenzie_personal_memories(household_id, owner_family_member_id, updated_at desc);
create index if not exists kenzie_personal_memories_owner_category_idx
  on public.kenzie_personal_memories(household_id, owner_family_member_id, category);
create index if not exists kenzie_personal_memories_expiration_idx
  on public.kenzie_personal_memories(expires_at)
  where status = 'active' and deleted_at is null and expires_at is not null;

drop trigger if exists kenzie_memory_settings_touch_updated_at on public.kenzie_memory_settings;
create trigger kenzie_memory_settings_touch_updated_at
before update on public.kenzie_memory_settings
for each row execute function public.touch_updated_at();

drop trigger if exists kenzie_personal_memories_touch_updated_at on public.kenzie_personal_memories;
create trigger kenzie_personal_memories_touch_updated_at
before update on public.kenzie_personal_memories
for each row execute function public.touch_updated_at();

alter table public.kenzie_memory_settings enable row level security;
alter table public.kenzie_personal_memories enable row level security;

create policy kenzie_memory_settings_owner_select
on public.kenzie_memory_settings for select to authenticated
using (
  public.is_household_member(household_id)
  and owner_family_member_id = public.current_family_member_id(household_id)
);
create policy kenzie_memory_settings_owner_insert
on public.kenzie_memory_settings for insert to authenticated
with check (
  public.is_household_member(household_id)
  and owner_family_member_id = public.current_family_member_id(household_id)
);
create policy kenzie_memory_settings_owner_update
on public.kenzie_memory_settings for update to authenticated
using (
  public.is_household_member(household_id)
  and owner_family_member_id = public.current_family_member_id(household_id)
)
with check (
  public.is_household_member(household_id)
  and owner_family_member_id = public.current_family_member_id(household_id)
);
create policy kenzie_memory_settings_owner_delete
on public.kenzie_memory_settings for delete to authenticated
using (
  public.is_household_member(household_id)
  and owner_family_member_id = public.current_family_member_id(household_id)
);

create policy kenzie_personal_memories_owner_select
on public.kenzie_personal_memories for select to authenticated
using (
  public.is_household_member(household_id)
  and owner_family_member_id = public.current_family_member_id(household_id)
);
create policy kenzie_personal_memories_owner_insert
on public.kenzie_personal_memories for insert to authenticated
with check (
  public.is_household_member(household_id)
  and owner_family_member_id = public.current_family_member_id(household_id)
);
create policy kenzie_personal_memories_owner_update
on public.kenzie_personal_memories for update to authenticated
using (
  public.is_household_member(household_id)
  and owner_family_member_id = public.current_family_member_id(household_id)
)
with check (
  public.is_household_member(household_id)
  and owner_family_member_id = public.current_family_member_id(household_id)
);
create policy kenzie_personal_memories_owner_delete
on public.kenzie_personal_memories for delete to authenticated
using (
  public.is_household_member(household_id)
  and owner_family_member_id = public.current_family_member_id(household_id)
);

grant select, insert, update, delete on public.kenzie_memory_settings to authenticated;
grant select, insert, update, delete on public.kenzie_personal_memories to authenticated;
