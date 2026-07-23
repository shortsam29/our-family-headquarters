create extension if not exists pgcrypto;

create type public.household_status as enum ('draft', 'configured', 'active', 'archived');
create type public.member_role as enum ('household_manager', 'parent', 'child', 'caregiver', 'guest');
create type public.member_status as enum ('active', 'inactive', 'archived');
create type public.event_category as enum ('family', 'school', 'appointment', 'work', 'celebration', 'household');
create type public.task_category as enum ('chore', 'homework', 'routine', 'personal');
create type public.task_scope as enum ('household', 'member');

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  time_zone text not null default 'UTC',
  preferred_language text not null default 'en',
  status public.household_status not null default 'draft',
  manager_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  linked_user_id uuid references auth.users(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 100),
  role public.member_role not null,
  status public.member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, linked_user_id)
);

create table public.household_memberships (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  status public.member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id),
  unique (family_member_id)
);

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null unique references public.family_members(id) on delete cascade,
  preferred_language text not null default 'en',
  time_format text not null default 'locale',
  accessibility_preferences jsonb not null default '{}'::jsonb,
  notification_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by_member_id uuid not null references public.family_members(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  category public.event_category not null default 'household',
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  all_day_date date,
  is_all_day boolean not null default false,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_all_day and all_day_date is not null and starts_at is null and ends_at is null)
    or
    (not is_all_day and starts_at is not null and ends_at is not null and ends_at > starts_at)
  )
);

create table public.event_participants (
  event_id uuid not null references public.schedule_events(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, family_member_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by_member_id uuid not null references public.family_members(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  category public.task_category not null,
  scope public.task_scope not null default 'member',
  due_date date,
  due_time time,
  daypart text check (daypart in ('Morning', 'Afternoon', 'Evening')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  assigned_by_member_id uuid not null references public.family_members(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  unique (task_id, family_member_id)
);

create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_assignment_id uuid not null references public.task_assignments(id) on delete cascade,
  completion_date date not null,
  completed_by_member_id uuid not null references public.family_members(id) on delete restrict,
  completed_at timestamptz not null default now(),
  unique (task_assignment_id, completion_date)
);

create index household_memberships_user_idx on public.household_memberships(user_id, status);
create index family_members_household_idx on public.family_members(household_id, status);
create index schedule_events_household_time_idx on public.schedule_events(household_id, starts_at);
create index schedule_events_household_day_idx on public.schedule_events(household_id, all_day_date);
create index tasks_household_due_idx on public.tasks(household_id, due_date, active);
create index task_assignments_member_idx on public.task_assignments(family_member_id);
create index task_completions_assignment_day_idx on public.task_completions(task_assignment_id, completion_date);

create or replace function public.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.household_memberships
    where household_id = target_household and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.current_family_member_id(target_household uuid)
returns uuid language sql stable security definer set search_path = public
as $$
  select family_member_id from public.household_memberships
  where household_id = target_household and user_id = auth.uid() and status = 'active'
  limit 1;
$$;

create or replace function public.current_member_role(target_household uuid)
returns public.member_role language sql stable security definer set search_path = public
as $$
  select fm.role
  from public.household_memberships hm
  join public.family_members fm on fm.id = hm.family_member_id
  where hm.household_id = target_household and hm.user_id = auth.uid() and hm.status = 'active'
  limit 1;
$$;

alter table public.households enable row level security;
alter table public.family_members enable row level security;
alter table public.household_memberships enable row level security;
alter table public.user_profiles enable row level security;
alter table public.schedule_events enable row level security;
alter table public.event_participants enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.task_completions enable row level security;

create policy households_read on public.households for select using (public.is_household_member(id));
create policy households_manager_update on public.households for update using (manager_user_id = auth.uid()) with check (manager_user_id = auth.uid());

create policy family_members_read on public.family_members for select using (public.is_household_member(household_id));
create policy family_members_manage on public.family_members for all
using (public.current_member_role(household_id) in ('household_manager', 'parent'))
with check (public.current_member_role(household_id) in ('household_manager', 'parent'));

create policy memberships_read_self_or_manager on public.household_memberships for select
using (user_id = auth.uid() or public.current_member_role(household_id) in ('household_manager', 'parent'));

create policy profiles_read_self_or_parent on public.user_profiles for select using (
  exists (
    select 1 from public.family_members fm
    where fm.id = family_member_id
      and (fm.linked_user_id = auth.uid() or public.current_member_role(fm.household_id) in ('household_manager', 'parent'))
  )
);

create policy schedule_read on public.schedule_events for select using (public.is_household_member(household_id));
create policy schedule_manage on public.schedule_events for all
using (public.current_member_role(household_id) in ('household_manager', 'parent'))
with check (public.current_member_role(household_id) in ('household_manager', 'parent'));

create policy participants_read on public.event_participants for select using (
  exists (select 1 from public.schedule_events e where e.id = event_id and public.is_household_member(e.household_id))
);
create policy participants_manage on public.event_participants for all using (
  exists (select 1 from public.schedule_events e where e.id = event_id and public.current_member_role(e.household_id) in ('household_manager', 'parent'))
) with check (
  exists (select 1 from public.schedule_events e where e.id = event_id and public.current_member_role(e.household_id) in ('household_manager', 'parent'))
);

create policy tasks_read on public.tasks for select using (public.is_household_member(household_id));
create policy tasks_manage on public.tasks for all
using (
  public.current_member_role(household_id) in ('household_manager', 'parent')
  or created_by_member_id = public.current_family_member_id(household_id)
)
with check (
  public.current_member_role(household_id) in ('household_manager', 'parent')
  or created_by_member_id = public.current_family_member_id(household_id)
);

create policy assignments_read on public.task_assignments for select using (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_household_member(t.household_id)
      and (
        family_member_id = public.current_family_member_id(t.household_id)
        or public.current_member_role(t.household_id) in ('household_manager', 'parent')
      )
  )
);
create policy assignments_manage on public.task_assignments for all using (
  exists (select 1 from public.tasks t where t.id = task_id and public.current_member_role(t.household_id) in ('household_manager', 'parent'))
) with check (
  exists (select 1 from public.tasks t where t.id = task_id and public.current_member_role(t.household_id) in ('household_manager', 'parent'))
);

create policy completions_read on public.task_completions for select using (
  exists (
    select 1 from public.task_assignments ta
    join public.tasks t on t.id = ta.task_id
    where ta.id = task_assignment_id
      and (ta.family_member_id = public.current_family_member_id(t.household_id)
        or public.current_member_role(t.household_id) in ('household_manager', 'parent'))
  )
);
create policy completions_insert_own on public.task_completions for insert with check (
  completed_by_member_id = (
    select ta.family_member_id from public.task_assignments ta where ta.id = task_assignment_id
  )
  and exists (
    select 1 from public.task_assignments ta
    join public.tasks t on t.id = ta.task_id
    where ta.id = task_assignment_id
      and ta.family_member_id = public.current_family_member_id(t.household_id)
  )
);
create policy completions_delete_own on public.task_completions for delete using (
  exists (
    select 1 from public.task_assignments ta
    join public.tasks t on t.id = ta.task_id
    where ta.id = task_assignment_id
      and ta.family_member_id = public.current_family_member_id(t.household_id)
  )
);

revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.current_family_member_id(uuid) from public;
revoke all on function public.current_member_role(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.current_family_member_id(uuid) to authenticated;
grant execute on function public.current_member_role(uuid) to authenticated;
