create or replace function public.sync_household_reminder_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null and current_user not in ('postgres', 'service_role') then
    raise exception 'Authenticated reminder notification sync required';
  end if;

  if tg_op = 'INSERT' then
    insert into public.internal_notifications (
      household_id, recipient_member_id, kind, title, body, related_destination,
      source_reminder_id, created_by_member_id, dedupe_key, created_at
    ) values (
      new.household_id, new.recipient_member_id, 'reminder', 'Reminder', new.message,
      coalesce(new.related_destination, '/my-headquarters'),
      new.id, new.created_by_member_id, 'reminder:' || new.dedupe_key, new.created_at
    )
    on conflict (source_reminder_id) where source_reminder_id is not null do nothing;
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    update public.internal_notifications
    set read_at = case when new.status = 'pending' then null else coalesce(read_at, now()) end
    where source_reminder_id = new.id
      and household_id = new.household_id
      and recipient_member_id = new.recipient_member_id;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_household_reminder_notification() from public;
revoke all on function public.sync_household_reminder_notification() from anon;
revoke all on function public.sync_household_reminder_notification() from authenticated;

drop trigger if exists household_reminders_sync_notification on public.household_reminders;
create trigger household_reminders_sync_notification
after insert or update of status on public.household_reminders
for each row execute function public.sync_household_reminder_notification();
