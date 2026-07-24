-- Version 1 completion: private Family Vault storage, household-owned memory,
-- Kenzie preferences, and explicitly approved tomorrow plans.

create type public.kenzie_plan_status as enum ('approved', 'cancelled');

create table public.household_memories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category text not null check (category in (
    'favorite_meal','disliked_meal','allergy','family_tradition','vacation',
    'birthday','anniversary','grocery_store','shopping_habit','school_schedule',
    'work_schedule','morning_routine','bedtime_routine','trash_day',
    'cleaning_schedule','vehicle_preference','pet_routine','holiday_tradition',
    'favorite_activity','family_note'
  )),
  label text not null check (char_length(label) between 1 and 120),
  value text not null check (char_length(value) between 1 and 2000),
  visibility public.record_visibility not null default 'household',
  created_by_member_id uuid not null references public.family_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, category, label)
);

create table public.kenzie_preferences (
  household_id uuid primary key references public.households(id) on delete cascade,
  greeting_style text not null default 'warm' check (greeting_style in ('warm','brief','playful')),
  reminder_style text not null default 'gentle' check (reminder_style in ('gentle','direct','minimal')),
  morning_briefing boolean not null default true,
  evening_recap boolean not null default true,
  planning_behavior text not null default 'balanced' check (planning_behavior in ('minimal','balanced','detailed')),
  meal_reminders boolean not null default true,
  shopping_reminders boolean not null default true,
  pet_reminders boolean not null default true,
  vehicle_reminders boolean not null default true,
  finance_reminders boolean not null default true,
  birthday_reminders boolean not null default true,
  holiday_reminders boolean not null default true,
  document_reminders boolean not null default true,
  updated_by_member_id uuid not null references public.family_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.kenzie_tomorrow_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  plan_date date not null,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  status public.kenzie_plan_status not null default 'approved',
  approved_by_member_id uuid not null references public.family_members(id) on delete restrict,
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, plan_date)
);

create index household_memories_household_category_idx on public.household_memories(household_id, category);
create index kenzie_tomorrow_plans_household_date_idx on public.kenzie_tomorrow_plans(household_id, plan_date);

create trigger household_memories_touch_updated_at before update on public.household_memories
for each row execute function public.touch_updated_at();
create trigger kenzie_preferences_touch_updated_at before update on public.kenzie_preferences
for each row execute function public.touch_updated_at();
create trigger kenzie_tomorrow_plans_touch_updated_at before update on public.kenzie_tomorrow_plans
for each row execute function public.touch_updated_at();

alter table public.household_memories enable row level security;
alter table public.kenzie_preferences enable row level security;
alter table public.kenzie_tomorrow_plans enable row level security;

create policy household_memories_read on public.household_memories for select using (
  public.is_household_member(household_id)
  and (visibility = 'household' or public.current_member_role(household_id) in ('household_manager','parent'))
);
create policy household_memories_manage on public.household_memories for all
using (public.current_member_role(household_id) in ('household_manager','parent'))
with check (
  public.current_member_role(household_id) in ('household_manager','parent')
  and created_by_member_id = public.current_family_member_id(household_id)
);

create policy kenzie_preferences_read on public.kenzie_preferences for select
using (public.is_household_member(household_id));
create policy kenzie_preferences_manage on public.kenzie_preferences for all
using (public.current_member_role(household_id) in ('household_manager','parent'))
with check (
  public.current_member_role(household_id) in ('household_manager','parent')
  and updated_by_member_id = public.current_family_member_id(household_id)
);

create policy kenzie_plans_read on public.kenzie_tomorrow_plans for select
using (public.is_household_member(household_id));
create policy kenzie_plans_manage on public.kenzie_tomorrow_plans for all
using (public.current_member_role(household_id) in ('household_manager','parent'))
with check (
  public.current_member_role(household_id) in ('household_manager','parent')
  and approved_by_member_id = public.current_family_member_id(household_id)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'family-vault',
  'family-vault',
  false,
  20971520,
  array[
    'application/pdf','image/jpeg','image/png','image/webp','image/gif',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain','text/csv'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy family_vault_storage_read on storage.objects for select using (
  bucket_id = 'family-vault'
  and exists (
    select 1
    from public.vault_documents d
    where d.storage_path = name
      and public.is_household_member(d.household_id)
      and (d.visibility = 'household' or public.current_member_role(d.household_id) in ('household_manager','parent'))
  )
);

create policy family_vault_storage_insert on storage.objects for insert with check (
  bucket_id = 'family-vault'
  and public.current_member_role(((storage.foldername(name))[1])::uuid) in ('household_manager','parent')
);

create policy family_vault_storage_update on storage.objects for update using (
  bucket_id = 'family-vault'
  and public.current_member_role(((storage.foldername(name))[1])::uuid) in ('household_manager','parent')
) with check (
  bucket_id = 'family-vault'
  and public.current_member_role(((storage.foldername(name))[1])::uuid) in ('household_manager','parent')
);

create policy family_vault_storage_delete on storage.objects for delete using (
  bucket_id = 'family-vault'
  and public.current_member_role(((storage.foldername(name))[1])::uuid) in ('household_manager','parent')
);
