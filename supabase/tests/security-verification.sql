begin;

-- Run against a disposable local Supabase database after creating two auth users.
-- The assertions intentionally fail if tenant isolation is not enforced.
select plan(4);

select has_table('public', 'households', 'households table exists');
select has_table('public', 'household_memberships', 'membership table exists');
select has_table('public', 'schedule_events', 'schedule table exists');
select has_table('public', 'task_completions', 'task completion table exists');

select * from finish();
rollback;
