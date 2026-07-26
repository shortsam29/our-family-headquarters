create or replace function public.is_samantha_household_member(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_memberships hm
    join public.family_members fm on fm.id = hm.family_member_id
    where hm.household_id = target_household
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and fm.status = 'active'
      and lower(fm.display_name) like 'samantha%'
  );
$$;

create policy wish_list_samantha_household_select
on public.personal_wish_list_items
for select
using (public.is_samantha_household_member(household_id));
