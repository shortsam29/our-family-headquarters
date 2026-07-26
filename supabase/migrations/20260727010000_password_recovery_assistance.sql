create or replace function public.household_member_account_emails()
returns table(member_id uuid, email text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select fm.id, au.email::text
  from public.household_memberships actor
  join public.family_members actor_member on actor_member.id = actor.family_member_id
  join public.family_members fm on fm.household_id = actor.household_id and fm.status = 'active'
  join auth.users au on au.id = fm.linked_user_id
  where actor.user_id = auth.uid()
    and actor.status = 'active'
    and actor_member.status = 'active'
    and actor_member.role in ('household_manager', 'parent')
  order by fm.display_name;
$$;

revoke all on function public.household_member_account_emails() from public;
grant execute on function public.household_member_account_emails() to authenticated;
