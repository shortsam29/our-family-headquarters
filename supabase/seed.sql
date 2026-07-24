\if :{?seed_adult_a_user_id}
\else
\echo 'seed_adult_a_user_id is required'
\quit
\endif
\if :{?seed_child_a_user_id}
\else
\echo 'seed_child_a_user_id is required'
\quit
\endif
\if :{?seed_adult_b_user_id}
\else
\echo 'seed_adult_b_user_id is required'
\quit
\endif
\if :{?seed_confirmation}
\else
\echo 'seed_confirmation is required'
\quit
\endif

select set_config('app.seed_confirmation', :'seed_confirmation', false);

do $$
begin
  if current_setting('app.seed_confirmation', true)
      is distinct from 'OUR_FAMILY_HEADQUARTERS_DEVELOPMENT' then
    raise exception 'Development seed refused: explicit development confirmation is required';
  end if;
end $$;

insert into public.households
  (id, name, time_zone, preferred_language, status, manager_user_id)
values
  ('a0000000-0000-4000-8000-000000000001', 'Willow Test Household', 'America/New_York', 'en', 'active', :'seed_adult_a_user_id'),
  ('b0000000-0000-4000-8000-000000000001', 'Cedar Test Household', 'America/Chicago', 'en', 'active', :'seed_adult_b_user_id')
on conflict (id) do update set
  name = excluded.name,
  time_zone = excluded.time_zone,
  preferred_language = excluded.preferred_language,
  status = excluded.status,
  manager_user_id = excluded.manager_user_id,
  updated_at = now();

insert into public.family_members
  (id, household_id, linked_user_id, display_name, role, status)
values
  ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', :'seed_adult_a_user_id', 'Willow Adult', 'household_manager', 'active'),
  ('a1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', :'seed_child_a_user_id', 'Willow Child', 'child', 'active'),
  ('b1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', :'seed_adult_b_user_id', 'Cedar Adult', 'household_manager', 'active')
on conflict (id) do update set
  household_id = excluded.household_id,
  linked_user_id = excluded.linked_user_id,
  display_name = excluded.display_name,
  role = excluded.role,
  status = excluded.status,
  updated_at = now();

insert into public.household_memberships
  (id, household_id, user_id, family_member_id, status)
values
  ('a2000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', :'seed_adult_a_user_id', 'a1000000-0000-4000-8000-000000000001', 'active'),
  ('a2000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', :'seed_child_a_user_id', 'a1000000-0000-4000-8000-000000000002', 'active'),
  ('b2000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', :'seed_adult_b_user_id', 'b1000000-0000-4000-8000-000000000001', 'active')
on conflict (id) do update set
  household_id = excluded.household_id,
  user_id = excluded.user_id,
  family_member_id = excluded.family_member_id,
  status = excluded.status,
  updated_at = now();

insert into public.user_profiles (id, family_member_id)
values
  ('a3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('a3000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002'),
  ('b3000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001')
on conflict (id) do update set
  family_member_id = excluded.family_member_id,
  updated_at = now();

insert into public.schedule_events
  (id, household_id, created_by_member_id, title, category, starts_at, ends_at, all_day_date, is_all_day)
values
  ('a4000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Willow family breakfast', 'family', (((now() at time zone 'America/New_York')::date + time '08:00') at time zone 'America/New_York'), (((now() at time zone 'America/New_York')::date + time '09:00') at time zone 'America/New_York'), null, false),
  ('a4000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Willow family day', 'celebration', null, null, (now() at time zone 'America/New_York')::date + 1, true),
  ('b4000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Cedar planning hour', 'household', (((now() at time zone 'America/Chicago')::date + time '10:00') at time zone 'America/Chicago'), (((now() at time zone 'America/Chicago')::date + time '11:00') at time zone 'America/Chicago'), null, false)
on conflict (id) do update set
  title = excluded.title,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  all_day_date = excluded.all_day_date,
  is_all_day = excluded.is_all_day,
  cancelled_at = null,
  updated_at = now();

insert into public.event_participants (event_id, family_member_id)
values
  ('a4000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('a4000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002'),
  ('a4000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001'),
  ('a4000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002'),
  ('b4000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001')
on conflict do nothing;

insert into public.tasks
  (id, household_id, created_by_member_id, title, category, scope, due_date, daypart, active)
values
  ('a5000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Put away test books', 'chore', 'member', (now() at time zone 'America/New_York')::date, 'Morning', true),
  ('a5000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Review the family plan', 'routine', 'household', (now() at time zone 'America/New_York')::date, 'Evening', true),
  ('b5000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Prepare Cedar notes', 'personal', 'member', (now() at time zone 'America/Chicago')::date, 'Afternoon', true)
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  scope = excluded.scope,
  due_date = excluded.due_date,
  daypart = excluded.daypart,
  active = excluded.active,
  updated_at = now();

insert into public.task_assignments
  (id, task_id, family_member_id, assigned_by_member_id)
values
  ('a6000000-0000-4000-8000-000000000001', 'a5000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001'),
  ('a6000000-0000-4000-8000-000000000002', 'a5000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('b6000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001')
on conflict (id) do update set
  task_id = excluded.task_id,
  family_member_id = excluded.family_member_id,
  assigned_by_member_id = excluded.assigned_by_member_id;

insert into public.task_completions
  (id, task_assignment_id, completion_date, completed_by_member_id)
values
  ('a7000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000002', (now() at time zone 'America/New_York')::date, 'a1000000-0000-4000-8000-000000000001')
on conflict (id) do update set
  task_assignment_id = excluded.task_assignment_id,
  completion_date = excluded.completion_date,
  completed_by_member_id = excluded.completed_by_member_id,
  completed_at = now();
