create table public.kenzie_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  recipient_member_id uuid not null,
  title text not null check (char_length(title) between 1 and 160),
  message text not null check (char_length(message) between 1 and 4000),
  related_destination text check (related_destination is null or (related_destination like '/%' and char_length(related_destination) <= 300)),
  created_by_kind text not null check (created_by_kind in ('kenzie', 'household_member')),
  created_by_member_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (household_id, recipient_member_id)
    references public.family_members(household_id, id) on delete cascade,
  foreign key (household_id, created_by_member_id)
    references public.family_members(household_id, id) on delete restrict,
  check (
    (created_by_kind = 'kenzie' and created_by_member_id is null)
    or (created_by_kind = 'household_member' and created_by_member_id is not null)
  )
);

create table public.internal_notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  recipient_member_id uuid not null,
  kind text not null check (kind in ('kenzie_note', 'reminder', 'chore', 'shopping', 'meal', 'calendar')),
  title text not null check (char_length(title) between 1 and 160),
  related_destination text check (related_destination is null or (related_destination like '/%' and char_length(related_destination) <= 300)),
  source_note_id uuid references public.kenzie_notes(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (household_id, recipient_member_id)
    references public.family_members(household_id, id) on delete cascade
);

create index kenzie_notes_recipient_unread_idx
  on public.kenzie_notes(recipient_member_id, created_at desc)
  where read_at is null;
create index internal_notifications_recipient_unread_idx
  on public.internal_notifications(recipient_member_id, created_at desc)
  where read_at is null;

alter table public.kenzie_notes enable row level security;
alter table public.internal_notifications enable row level security;

create policy kenzie_notes_recipient_read
on public.kenzie_notes for select to authenticated
using (
  public.is_household_member(household_id)
  and recipient_member_id = public.current_family_member_id(household_id)
);

create policy kenzie_notes_recipient_update
on public.kenzie_notes for update to authenticated
using (
  public.is_household_member(household_id)
  and recipient_member_id = public.current_family_member_id(household_id)
)
with check (
  public.is_household_member(household_id)
  and recipient_member_id = public.current_family_member_id(household_id)
);

create policy kenzie_notes_manager_create
on public.kenzie_notes for insert to authenticated
with check (
  public.current_member_role(household_id) in ('household_manager', 'parent')
  and created_by_kind = 'household_member'
  and created_by_member_id = public.current_family_member_id(household_id)
);

create policy internal_notifications_recipient_read
on public.internal_notifications for select to authenticated
using (
  public.is_household_member(household_id)
  and recipient_member_id = public.current_family_member_id(household_id)
);

create policy internal_notifications_recipient_update
on public.internal_notifications for update to authenticated
using (
  public.is_household_member(household_id)
  and recipient_member_id = public.current_family_member_id(household_id)
)
with check (
  public.is_household_member(household_id)
  and recipient_member_id = public.current_family_member_id(household_id)
);

grant select, insert, update on public.kenzie_notes to authenticated;
grant select, update on public.internal_notifications to authenticated;
