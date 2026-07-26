-- Allow an authenticated household member to assign a task they created to only themselves.
-- Manager/parent assignment permissions remain unchanged in assignments_manage.
create policy assignments_insert_self
on public.task_assignments
for insert
to authenticated
with check (
  family_member_id = assigned_by_member_id
  and exists (
    select 1
    from public.tasks t
    where t.id = task_id
      and t.scope = 'member'
      and t.created_by_member_id = family_member_id
      and family_member_id = public.current_family_member_id(t.household_id)
      and public.is_household_member(t.household_id)
  )
);