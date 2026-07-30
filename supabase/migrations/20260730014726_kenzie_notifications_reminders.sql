alter table public.kenzie_notes
  add column if not exists archived_at timestamptz;

alter table public.internal_notifications
  add column if not exists body text check (body is null or char_length(body) <= 1000),
  add column if not exists created_by_member_id uuid,
  add column if not exists dedupe_key text check (dedupe_key is null or char_length(dedupe_key) between 1 and 200);

alter table public.internal_notifications
  add constraint internal_notifications_creator_household_fkey
  foreign key (household_id, created_by_member_id)
  references public.family_members(household_id, id) on delete restrict;

create table public.household_reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  recipient_member_id uuid not null,
  message text not null check (char_length(message) between 1 and 500),
  due_at timestamptz not null,
  time_zone text not null check (char_length(time_zone) between 1 and 100),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  related_destination text check (
    related_destination is null
    or (related_destination like '/%' and char_length(related_destination) <= 300)
  ),
  created_by_member_id uuid not null,
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (household_id, recipient_member_id)
    references public.family_members(household_id, id) on delete cascade,
  foreign key (household_id, created_by_member_id)
    references public.family_members(household_id, id) on delete restrict,
  unique (household_id, recipient_member_id, dedupe_key)
);

alter table public.internal_notifications
  add column if not exists source_reminder_id uuid
  references public.household_reminders(id) on delete cascade;

create unique index if not exists internal_notifications_note_once_idx
  on public.internal_notifications(source_note_id)
  where source_note_id is not null;
create unique index if not exists internal_notifications_reminder_once_idx
  on public.internal_notifications(source_reminder_id)
  where source_reminder_id is not null;
create unique index if not exists internal_notifications_dedupe_idx
  on public.internal_notifications(household_id, recipient_member_id, dedupe_key)
  where dedupe_key is not null;
create index if not exists household_reminders_recipient_due_idx
  on public.household_reminders(recipient_member_id, due_at)
  where status = 'pending';

create or replace function public.sync_kenzie_note_notification()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
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
  elsif tg_op = 'UPDATE' and (new.read_at is distinct from old.read_at or new.archived_at is distinct from old.archived_at) then
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

drop trigger if exists kenzie_notes_sync_notification on public.kenzie_notes;
create trigger kenzie_notes_sync_notification
after insert or update of read_at, archived_at on public.kenzie_notes
for each row execute function public.sync_kenzie_note_notification();

insert into public.internal_notifications (
  household_id, recipient_member_id, kind, title, body, related_destination,
  source_note_id, created_by_member_id, dedupe_key, read_at, created_at
)
select
  n.household_id, n.recipient_member_id, 'kenzie_note', n.title, n.message,
  coalesce(n.related_destination, '/my-headquarters#notes-from-kenzie'),
  n.id, n.created_by_member_id, 'kenzie-note:' || n.id::text, n.read_at, n.created_at
from public.kenzie_notes n
on conflict (source_note_id) where source_note_id is not null do nothing;

create trigger household_reminders_touch_updated_at
before update on public.household_reminders
for each row execute function public.touch_updated_at();

alter table public.household_reminders enable row level security;

drop policy if exists kenzie_notes_manager_create on public.kenzie_notes;
create policy kenzie_notes_authorized_create
on public.kenzie_notes for insert to authenticated
with check (
  public.is_household_member(household_id)
  and created_by_kind = 'household_member'
  and created_by_member_id = public.current_family_member_id(household_id)
  and (
    recipient_member_id = public.current_family_member_id(household_id)
    or public.current_member_role(household_id) in ('household_manager', 'parent')
  )
);

create policy household_reminders_recipient_read
on public.household_reminders for select to authenticated
using (
  public.is_household_member(household_id)
  and recipient_member_id = public.current_family_member_id(household_id)
);

create policy household_reminders_authorized_create
on public.household_reminders for insert to authenticated
with check (
  public.is_household_member(household_id)
  and created_by_member_id = public.current_family_member_id(household_id)
  and (
    recipient_member_id = public.current_family_member_id(household_id)
    or public.current_member_role(household_id) in ('household_manager', 'parent')
  )
);

create policy household_reminders_recipient_update
on public.household_reminders for update to authenticated
using (
  public.is_household_member(household_id)
  and recipient_member_id = public.current_family_member_id(household_id)
)
with check (
  public.is_household_member(household_id)
  and recipient_member_id = public.current_family_member_id(household_id)
);

create policy internal_notifications_authorized_create
on public.internal_notifications for insert to authenticated
with check (
  public.is_household_member(household_id)
  and created_by_member_id = public.current_family_member_id(household_id)
  and (
    recipient_member_id = public.current_family_member_id(household_id)
    or public.current_member_role(household_id) in ('household_manager', 'parent')
  )
);

grant select, insert, update on public.household_reminders to authenticated;
grant insert on public.internal_notifications to authenticated;
