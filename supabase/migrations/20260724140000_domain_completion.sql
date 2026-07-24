-- Forward-only domain completion for the development project.
-- No destructive statements: existing tables and data remain unchanged.

create type public.meal_status as enum ('planned', 'confirmed', 'prepared', 'completed', 'archived');
create type public.shopping_list_type as enum ('grocery', 'household');
create type public.shopping_item_status as enum ('needed', 'purchased', 'archived');
create type public.record_visibility as enum ('household', 'adults');
create type public.reminder_status as enum ('active', 'completed', 'archived');
create type public.finance_kind as enum ('bill', 'subscription');
create type public.finance_status as enum ('upcoming', 'paid', 'archived');

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  instructions text,
  servings integer check (servings is null or servings > 0),
  preparation_minutes integer check (preparation_minutes is null or preparation_minutes >= 0),
  notes text,
  created_by_member_id uuid not null references public.family_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, name)
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  quantity numeric check (quantity is null or quantity > 0),
  unit text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipe_id, name)
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  week_start date not null,
  notes text,
  created_by_member_id uuid not null references public.family_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, week_start)
);

create table public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  planned_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  name text not null check (char_length(name) between 1 and 160),
  recipe_id uuid references public.recipes(id) on delete set null,
  notes text,
  assigned_cook_member_id uuid references public.family_members(id) on delete set null,
  status public.meal_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meal_plan_id, planned_date, meal_type)
);

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  list_type public.shopping_list_type not null,
  archived_at timestamptz,
  created_by_member_id uuid not null references public.family_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, name, list_type)
);

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  category text,
  quantity numeric check (quantity is null or quantity > 0),
  unit text,
  notes text,
  status public.shopping_item_status not null default 'needed',
  source_recipe_id uuid references public.recipes(id) on delete set null,
  added_by_member_id uuid not null references public.family_members(id) on delete restrict,
  purchased_by_member_id uuid references public.family_members(id) on delete set null,
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  species text not null check (char_length(species) between 1 and 80),
  breed text,
  birth_date date,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, name)
);

create table public.pet_care_reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  due_date date,
  notes text,
  status public.reminder_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_contacts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (char_length(category) between 1 and 80),
  phone text,
  email text,
  notes text,
  is_emergency boolean not null default false,
  visibility public.record_visibility not null default 'household',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, name, category)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  make text,
  model text,
  model_year integer check (model_year is null or model_year between 1886 and 2200),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, name)
);

create table public.vehicle_reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  due_date date,
  reminder_type text not null default 'maintenance',
  notes text,
  status public.reminder_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vault_documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  category text not null check (char_length(category) between 1 and 80),
  owner_member_id uuid references public.family_members(id) on delete set null,
  visibility public.record_visibility not null default 'adults',
  storage_path text,
  expiration_date date,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, title, category)
);

create table public.finance_obligations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  kind public.finance_kind not null,
  category text,
  amount numeric(12,2) check (amount is null or amount >= 0),
  due_date date,
  recurrence text,
  status public.finance_status not null default 'upcoming',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, title, due_date)
);

create index recipes_household_idx on public.recipes(household_id, name);
create index meal_plans_household_week_idx on public.meal_plans(household_id, week_start);
create index meal_entries_household_date_idx on public.meal_plan_entries(household_id, planned_date);
create index shopping_lists_household_idx on public.shopping_lists(household_id, list_type);
create index shopping_items_list_status_idx on public.shopping_list_items(shopping_list_id, status);
create index pets_household_idx on public.pets(household_id, active);
create index pet_reminders_household_due_idx on public.pet_care_reminders(household_id, due_date, status);
create index contacts_household_category_idx on public.household_contacts(household_id, category);
create index vehicles_household_idx on public.vehicles(household_id, active);
create index vehicle_reminders_household_due_idx on public.vehicle_reminders(household_id, due_date, status);
create index vault_documents_household_expiry_idx on public.vault_documents(household_id, expiration_date);
create index finance_obligations_household_due_idx on public.finance_obligations(household_id, due_date, status);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'recipes','recipe_ingredients','meal_plans','meal_plan_entries',
    'shopping_lists','shopping_list_items','pets','pet_care_reminders',
    'household_contacts','vehicles','vehicle_reminders','vault_documents','finance_obligations'
  ] loop
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', table_name, table_name);
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

-- Household-readable, adult-managed domains.
create policy recipes_read on public.recipes for select using (public.is_household_member(household_id));
create policy recipes_manage on public.recipes for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));
create policy ingredients_read on public.recipe_ingredients for select using (public.is_household_member(household_id));
create policy ingredients_manage on public.recipe_ingredients for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));
create policy meal_plans_read on public.meal_plans for select using (public.is_household_member(household_id));
create policy meal_plans_manage on public.meal_plans for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));
create policy meal_entries_read on public.meal_plan_entries for select using (public.is_household_member(household_id));
create policy meal_entries_manage on public.meal_plan_entries for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));
create policy pets_read on public.pets for select using (public.is_household_member(household_id));
create policy pets_manage on public.pets for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));
create policy pet_reminders_read on public.pet_care_reminders for select using (public.is_household_member(household_id));
create policy pet_reminders_manage on public.pet_care_reminders for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));
create policy vehicles_read on public.vehicles for select using (public.is_household_member(household_id));
create policy vehicles_manage on public.vehicles for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));
create policy vehicle_reminders_read on public.vehicle_reminders for select using (public.is_household_member(household_id));
create policy vehicle_reminders_manage on public.vehicle_reminders for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));

-- Shopping is collaborative: members may add and update, while adults control list deletion.
create policy shopping_lists_read on public.shopping_lists for select using (public.is_household_member(household_id));
create policy shopping_lists_insert on public.shopping_lists for insert with check (public.is_household_member(household_id) and created_by_member_id = public.current_family_member_id(household_id));
create policy shopping_lists_update on public.shopping_lists for update using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy shopping_lists_delete on public.shopping_lists for delete using (public.current_member_role(household_id) in ('household_manager','parent'));
create policy shopping_items_read on public.shopping_list_items for select using (public.is_household_member(household_id));
create policy shopping_items_insert on public.shopping_list_items for insert with check (public.is_household_member(household_id) and added_by_member_id = public.current_family_member_id(household_id));
create policy shopping_items_update on public.shopping_list_items for update using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy shopping_items_delete on public.shopping_list_items for delete using (public.current_member_role(household_id) in ('household_manager','parent') or added_by_member_id = public.current_family_member_id(household_id));

-- Contacts may be household-visible or adult-only.
create policy contacts_read on public.household_contacts for select using (
  public.is_household_member(household_id)
  and (visibility = 'household' or public.current_member_role(household_id) in ('household_manager','parent'))
);
create policy contacts_manage on public.household_contacts for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));

-- Vault and finance remain adult-only by default. Explicit household vault records may be shared.
create policy vault_read on public.vault_documents for select using (
  public.is_household_member(household_id)
  and (visibility = 'household' or public.current_member_role(household_id) in ('household_manager','parent'))
);
create policy vault_manage on public.vault_documents for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));
create policy finance_read on public.finance_obligations for select using (public.current_member_role(household_id) in ('household_manager','parent'));
create policy finance_manage on public.finance_obligations for all using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));

create or replace function public.create_first_household(
  household_name text,
  member_display_name text,
  household_time_zone text default 'UTC'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  new_household_id uuid;
  new_member_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.household_memberships where user_id = actor and status = 'active') then
    raise exception 'User already belongs to a household';
  end if;
  if char_length(trim(household_name)) not between 1 and 120 then raise exception 'Invalid household name'; end if;
  if char_length(trim(member_display_name)) not between 1 and 100 then raise exception 'Invalid member name'; end if;

  insert into public.households(name, time_zone, status, manager_user_id)
  values (trim(household_name), trim(household_time_zone), 'active', actor)
  returning id into new_household_id;

  insert into public.family_members(household_id, linked_user_id, display_name, role, status)
  values (new_household_id, actor, trim(member_display_name), 'household_manager', 'active')
  returning id into new_member_id;

  insert into public.household_memberships(household_id, user_id, family_member_id, status)
  values (new_household_id, actor, new_member_id, 'active');

  insert into public.user_profiles(family_member_id) values (new_member_id);
  return new_household_id;
end;
$$;

revoke all on function public.create_first_household(text,text,text) from public;
grant execute on function public.create_first_household(text,text,text) to authenticated;
