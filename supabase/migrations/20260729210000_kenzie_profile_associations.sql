alter table public.family_members
  add constraint family_members_household_id_id_key unique (household_id, id);

create table public.kenzie_profile_associations (
  family_member_id uuid primary key,
  household_id uuid not null,
  profile_key text not null check (profile_key in ('samantha', 'jason', 'robbie', 'braeden', 'fran')),
  assigned_by_member_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (household_id, family_member_id)
    references public.family_members(household_id, id) on delete cascade,
  foreign key (household_id, assigned_by_member_id)
    references public.family_members(household_id, id) on delete restrict,
  unique (household_id, profile_key)
);

alter table public.kenzie_profile_associations enable row level security;

create policy kenzie_profile_associations_read
on public.kenzie_profile_associations
for select
to authenticated
using (
  family_member_id = public.current_family_member_id(household_id)
  or public.current_member_role(household_id) in ('household_manager', 'parent')
);

create policy kenzie_profile_associations_insert
on public.kenzie_profile_associations
for insert
to authenticated
with check (
  public.current_member_role(household_id) in ('household_manager', 'parent')
  and assigned_by_member_id = public.current_family_member_id(household_id)
);

create policy kenzie_profile_associations_update
on public.kenzie_profile_associations
for update
to authenticated
using (public.current_member_role(household_id) in ('household_manager', 'parent'))
with check (
  public.current_member_role(household_id) in ('household_manager', 'parent')
  and assigned_by_member_id = public.current_family_member_id(household_id)
);

create policy kenzie_profile_associations_delete
on public.kenzie_profile_associations
for delete
to authenticated
using (public.current_member_role(household_id) in ('household_manager', 'parent'));

grant select, insert, update, delete on public.kenzie_profile_associations to authenticated;
