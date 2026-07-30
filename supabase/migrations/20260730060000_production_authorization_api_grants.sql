-- Production hardening for installations where Data API privileges are not
-- granted implicitly. RLS remains the row-level authorization boundary.

create or replace function public.is_personalized_planner_owner(
  target_household uuid,
  target_member uuid,
  target_type text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_type in ('reading', 'diy', 'training', 'fight')
    and exists (
      select 1
      from public.household_memberships hm
      join public.family_members fm
        on fm.id = hm.family_member_id
       and fm.household_id = hm.household_id
      where hm.household_id = target_household
        and hm.family_member_id = target_member
        and hm.user_id = (select auth.uid())
        and hm.status = 'active'
        and fm.linked_user_id = (select auth.uid())
        and fm.status = 'active'
        and fm.role in ('household_manager', 'parent')
    );
$$;

drop policy if exists wish_list_samantha_household_select
  on public.personal_wish_list_items;
drop function if exists public.is_samantha_household_member(uuid);

create or replace function public.can_view_household_wish_lists(
  target_household uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_memberships hm
    join public.family_members fm
      on fm.id = hm.family_member_id
     and fm.household_id = hm.household_id
    where hm.household_id = target_household
      and hm.user_id = (select auth.uid())
      and hm.status = 'active'
      and fm.linked_user_id = (select auth.uid())
      and fm.status = 'active'
      and fm.role in ('household_manager', 'parent')
  );
$$;

create policy personal_wish_list_household_adult_select
on public.personal_wish_list_items
for select
to authenticated
using ((select public.can_view_household_wish_lists(household_id)));

-- Remove implicit table access before assigning the operations used by the app.
revoke all on table
  public.households,
  public.family_members,
  public.household_memberships,
  public.user_profiles,
  public.schedule_events,
  public.event_participants,
  public.tasks,
  public.task_assignments,
  public.task_completions,
  public.recipes,
  public.recipe_ingredients,
  public.meal_plans,
  public.meal_plan_entries,
  public.shopping_lists,
  public.shopping_list_items,
  public.pets,
  public.pet_care_reminders,
  public.household_contacts,
  public.vehicles,
  public.vehicle_reminders,
  public.vault_documents,
  public.finance_obligations,
  public.household_memories,
  public.kenzie_preferences,
  public.kenzie_tomorrow_plans,
  public.household_invitations,
  public.family_conversations,
  public.family_announcements,
  public.household_passwords,
  public.vacations,
  public.personal_brain_dump_notes,
  public.personal_wish_list_items,
  public.personal_planner_items,
  public.kenzie_profile_associations,
  public.kenzie_notes,
  public.internal_notifications,
  public.household_reminders,
  public.kenzie_memory_settings,
  public.kenzie_personal_memories
from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select, update on public.households to authenticated;
grant select, insert, update on public.family_members to authenticated;
grant select on public.household_memberships, public.user_profiles to authenticated;

grant select, insert, update, delete on
  public.schedule_events,
  public.tasks,
  public.task_completions,
  public.meal_plan_entries,
  public.shopping_list_items,
  public.pets,
  public.household_contacts,
  public.vehicles,
  public.vault_documents,
  public.finance_obligations,
  public.household_memories,
  public.family_conversations,
  public.personal_brain_dump_notes,
  public.personal_wish_list_items,
  public.personal_planner_items,
  public.kenzie_profile_associations,
  public.kenzie_memory_settings,
  public.kenzie_personal_memories
to authenticated;

grant select, insert, delete on public.event_participants to authenticated;
grant select, insert, delete on public.task_assignments to authenticated;
grant select, insert, delete on public.recipes to authenticated;
grant select, insert on public.recipe_ingredients to authenticated;
grant select, insert, update on
  public.meal_plans,
  public.pet_care_reminders,
  public.vehicle_reminders,
  public.kenzie_preferences,
  public.kenzie_tomorrow_plans
to authenticated;
grant select, insert, update, delete on public.shopping_lists to authenticated;
grant select, insert, update on public.household_invitations to authenticated;
grant select, insert, delete on
  public.family_announcements,
  public.household_passwords,
  public.vacations
to authenticated;
grant select, insert, update on
  public.kenzie_notes,
  public.internal_notifications,
  public.household_reminders
to authenticated;

-- All primary keys use UUID defaults; these migrations create no application
-- sequences, so no sequence privileges are required.

-- SECURITY DEFINER and RPC functions are executable only by intended roles.
revoke all on function public.is_household_member(uuid) from public, anon, authenticated;
revoke all on function public.current_family_member_id(uuid) from public, anon, authenticated;
revoke all on function public.current_member_role(uuid) from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.create_first_household(text, text, text) from public, anon, authenticated;
revoke all on function public.validate_household_invitation(text) from public, anon, authenticated;
revoke all on function public.redeem_household_invitation(text) from public, anon, authenticated;
revoke all on function public.archive_household_member(uuid) from public, anon, authenticated;
revoke all on function public.is_personalized_planner_owner(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.link_personal_planner_item_to_schedule(uuid, boolean) from public, anon, authenticated;
revoke all on function public.can_view_household_wish_lists(uuid) from public, anon, authenticated;
revoke all on function public.household_member_account_emails() from public, anon, authenticated;
revoke all on function public.sync_kenzie_note_notification() from public, anon, authenticated;
revoke all on function public.sync_household_reminder_notification() from public, anon, authenticated;

grant execute on function public.validate_household_invitation(text) to anon, authenticated;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.current_family_member_id(uuid) to authenticated;
grant execute on function public.current_member_role(uuid) to authenticated;
grant execute on function public.create_first_household(text, text, text) to authenticated;
grant execute on function public.redeem_household_invitation(text) to authenticated;
grant execute on function public.archive_household_member(uuid) to authenticated;
grant execute on function public.is_personalized_planner_owner(uuid, uuid, text) to authenticated;
grant execute on function public.link_personal_planner_item_to_schedule(uuid, boolean) to authenticated;
grant execute on function public.can_view_household_wish_lists(uuid) to authenticated;
grant execute on function public.household_member_account_emails() to authenticated;
