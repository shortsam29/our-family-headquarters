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

begin;

create temporary table rls_verification_results (
  test_name text primary key,
  passed boolean not null
) on commit drop;

create or replace function pg_temp.record_rls_check(check_name text, check_passed boolean)
returns void
language plpgsql
as $$
begin
  insert into rls_verification_results (test_name, passed)
  values (check_name, check_passed);
  if not check_passed then
    raise exception 'RLS verification failed: %', check_name;
  end if;
end;
$$;

grant select, insert on table rls_verification_results to anon, authenticated;
grant execute on function pg_temp.record_rls_check(text, boolean) to anon, authenticated;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.record_rls_check('anonymous household reads are denied', (select count(*) = 0 from public.households));
select pg_temp.record_rls_check('anonymous schedule reads are denied', (select count(*) = 0 from public.schedule_events));
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', :'seed_adult_a_user_id', true);
select pg_temp.record_rls_check('Household A sees one household', (select count(*) = 1 from public.households));
select pg_temp.record_rls_check('Household A cannot read Household B', (select count(*) = 0 from public.households where id = 'b0000000-0000-4000-8000-000000000001'));
select pg_temp.record_rls_check('Household A sees only its members', (select count(*) = 2 from public.family_members));
select pg_temp.record_rls_check('Household A sees its schedule', (select count(*) = 2 from public.schedule_events where household_id = 'a0000000-0000-4000-8000-000000000001'));
select pg_temp.record_rls_check('Household A cannot read Household B schedule', (select count(*) = 0 from public.schedule_events where household_id = 'b0000000-0000-4000-8000-000000000001'));
do $$
declare
  changed_count integer;
begin
  update public.schedule_events
  set title = 'Blocked cross-household update'
  where id = 'b4000000-0000-4000-8000-000000000001';
  get diagnostics changed_count = row_count;
  perform pg_temp.record_rls_check('Household A cannot modify Household B schedule', changed_count = 0);
end;
$$;
select pg_temp.record_rls_check(
  'Household A current-user resolution is correct',
  (select household_id = 'a0000000-0000-4000-8000-000000000001'::uuid
   from public.household_memberships where user_id = :'seed_adult_a_user_id')
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', :'seed_child_a_user_id', true);
select pg_temp.record_rls_check('Child sees only the assigned task', (select count(*) = 1 from public.task_assignments));
do $$
begin
  begin
    insert into public.task_completions
      (task_assignment_id, completion_date, completed_by_member_id)
    values
      ('a6000000-0000-4000-8000-000000000002', current_date, 'a1000000-0000-4000-8000-000000000002');
    perform pg_temp.record_rls_check('Child cannot complete another member task', false);
  exception
    when insufficient_privilege then
      perform pg_temp.record_rls_check('Child cannot complete another member task', true);
  end;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', :'seed_adult_b_user_id', true);
select pg_temp.record_rls_check('Household B sees one household', (select count(*) = 1 from public.households));
select pg_temp.record_rls_check('Household B cannot read Household A', (select count(*) = 0 from public.households where id = 'a0000000-0000-4000-8000-000000000001'));
select pg_temp.record_rls_check('Household B sees only its member', (select count(*) = 1 from public.family_members));
select pg_temp.record_rls_check(
  'Household B current-user resolution is correct',
  (select household_id = 'b0000000-0000-4000-8000-000000000001'::uuid
   from public.household_memberships where user_id = :'seed_adult_b_user_id')
);
reset role;

select test_name, passed from rls_verification_results order by test_name;
rollback;
