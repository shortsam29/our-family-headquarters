alter table public.shopping_list_items add column if not exists store text;
alter table public.schedule_events drop constraint if exists schedule_events_recurrence_check;
alter table public.schedule_events add constraint schedule_events_recurrence_check check (recurrence is null or recurrence in ('daily','weekly','monthly','yearly'));

create table public.household_passwords (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  site_app text not null check (char_length(site_app) between 1 and 160), username text, password_value text not null check (char_length(password_value) between 1 and 500), notes text,
  created_by_member_id uuid not null references public.family_members(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(household_id,site_app,username)
);
create table public.vacations (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160), starts_on date, ends_on date, locations text, itinerary text, hotels text, flights text, confirmation_numbers text, notes text,
  created_by_member_id uuid not null references public.family_members(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index household_passwords_household_idx on public.household_passwords(household_id,site_app);
create index vacations_household_dates_idx on public.vacations(household_id,starts_on);
alter table public.household_passwords enable row level security;
alter table public.vacations enable row level security;
create policy household_passwords_read on public.household_passwords for select using (public.is_household_member(household_id));
create policy household_passwords_manage on public.household_passwords for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));
create policy vacations_read on public.vacations for select using (public.is_household_member(household_id));
create policy vacations_manage on public.vacations for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));
drop trigger if exists household_passwords_touch_updated_at on public.household_passwords;
create trigger household_passwords_touch_updated_at before update on public.household_passwords for each row execute function public.touch_updated_at();
drop trigger if exists vacations_touch_updated_at on public.vacations;
create trigger vacations_touch_updated_at before update on public.vacations for each row execute function public.touch_updated_at();
