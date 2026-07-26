alter table public.tasks
  add column if not exists description text,
  add column if not exists priority text not null default 'normal' check (priority in ('low','normal','high')),
  add column if not exists recurrence text check (recurrence in ('daily','weekly','monthly')),
  add column if not exists archived_at timestamptz;

alter table public.schedule_events
  add column if not exists recurrence text check (recurrence in ('daily','weekly','monthly')),
  add column if not exists reminder_minutes integer check (reminder_minutes is null or reminder_minutes between 0 and 10080);

alter table public.shopping_list_items
  add column if not exists priority text not null default 'normal' check (priority in ('low','normal','high'));

create index if not exists tasks_household_active_due_idx on public.tasks(household_id, active, due_date) where archived_at is null;
