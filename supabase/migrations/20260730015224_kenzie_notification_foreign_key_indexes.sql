create index if not exists household_reminders_creator_idx
  on public.household_reminders(household_id, created_by_member_id);
create index if not exists internal_notifications_creator_idx
  on public.internal_notifications(household_id, created_by_member_id);
create index if not exists kenzie_notes_recipient_household_idx
  on public.kenzie_notes(household_id, recipient_member_id);
create index if not exists kenzie_notes_creator_idx
  on public.kenzie_notes(household_id, created_by_member_id);
