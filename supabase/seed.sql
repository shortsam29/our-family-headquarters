\if :{?seed_user_id}
\else
\echo 'seed_user_id is required'
\quit
\endif

do $$
begin
  if current_setting('app.environment', true) is distinct from 'development' then
    raise exception 'Development seed refused: app.environment must equal development';
  end if;
end $$;

with household as (
  insert into public.households (name, time_zone, preferred_language, status, manager_user_id)
  values ('Sample Family Home', 'America/New_York', 'en', 'active', :'seed_user_id')
  on conflict do nothing
  returning id
), member as (
  insert into public.family_members (household_id, linked_user_id, display_name, role)
  select id, :'seed_user_id', 'Sample Adult', 'household_manager' from household
  returning id, household_id
), membership as (
  insert into public.household_memberships (household_id, user_id, family_member_id)
  select household_id, :'seed_user_id', id from member
), profile as (
  insert into public.user_profiles (family_member_id)
  select id from member
)
insert into public.tasks (household_id, created_by_member_id, title, category, due_date, daypart)
select household_id, id, 'Put the library books by the door', 'personal', current_date, 'Evening'
from member;
