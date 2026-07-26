create table public.family_conversations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete restrict,
  message text not null check (char_length(message) between 1 and 500),
  handled_at timestamptz,
  handled_by_member_id uuid references public.family_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.family_announcements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by_member_id uuid not null references public.family_members(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  message text not null check (char_length(message) between 1 and 1000),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index family_conversations_household_created_idx on public.family_conversations(household_id, created_at desc) where handled_at is null;
create index family_announcements_household_created_idx on public.family_announcements(household_id, created_at desc);
alter table public.family_conversations enable row level security;
alter table public.family_announcements enable row level security;
create policy family_conversations_read on public.family_conversations for select using (public.is_household_member(household_id));
create policy family_conversations_insert on public.family_conversations for insert with check (public.is_household_member(household_id) and member_id = public.current_family_member_id(household_id));
create policy family_conversations_update on public.family_conversations for update using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy family_conversations_delete on public.family_conversations for delete using (member_id = public.current_family_member_id(household_id) or public.current_member_role(household_id) in ('household_manager','parent'));
create policy family_announcements_read on public.family_announcements for select using (public.is_household_member(household_id));
create policy family_announcements_manage on public.family_announcements for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));
create trigger family_conversations_updated_at before update on public.family_conversations for each row execute function public.touch_updated_at();
create trigger family_announcements_updated_at before update on public.family_announcements for each row execute function public.touch_updated_at();
