create or replace function public.sync_kenzie_note_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null and current_user not in ('postgres', 'service_role') then
    raise exception 'Authenticated note notification sync required';
  end if;

  if tg_op = 'INSERT' then
    insert into public.internal_notifications (
      household_id, recipient_member_id, kind, title, body, related_destination,
      source_note_id, created_by_member_id, dedupe_key, read_at, created_at
    ) values (
      new.household_id, new.recipient_member_id, 'kenzie_note', new.title, new.message,
      coalesce(new.related_destination, '/my-headquarters#notes-from-kenzie'),
      new.id, new.created_by_member_id, 'kenzie-note:' || new.id::text,
      new.read_at, new.created_at
    )
    on conflict (source_note_id) where source_note_id is not null do nothing;
  elsif tg_op = 'UPDATE'
    and (new.read_at is distinct from old.read_at or new.archived_at is distinct from old.archived_at)
  then
    update public.internal_notifications
    set read_at = coalesce(new.read_at, new.archived_at)
    where source_note_id = new.id
      and household_id = new.household_id
      and recipient_member_id = new.recipient_member_id;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_kenzie_note_notification() from public;
revoke all on function public.sync_kenzie_note_notification() from anon;
revoke all on function public.sync_kenzie_note_notification() from authenticated;
