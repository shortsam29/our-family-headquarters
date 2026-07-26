-- Private Samantha/Jason planning tools and atomic links to the household schedule.
create table public.personal_planner_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  owner_member_id uuid not null references public.family_members(id) on delete cascade,
  item_type text not null check (item_type in ('reading','diy','training','fight')),
  title text not null check (char_length(title) between 1 and 200),
  author text check (author is null or char_length(author) <= 200),
  notes text check (notes is null or char_length(notes) <= 5000),
  materials text check (materials is null or char_length(materials) <= 5000),
  link_store text check (link_store is null or char_length(link_store) <= 500),
  location text check (location is null or char_length(location) <= 300),
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  status text not null default 'active' check (status in ('active','want_to_read','completed','read')),
  completed_at timestamptz,
  schedule_event_id uuid references public.schedule_events(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date),
  check (item_type not in ('training','fight') or (start_date is not null and start_time is not null and end_time is not null))
);
create index personal_planner_owner_type_idx on public.personal_planner_items(owner_user_id,item_type,status,created_at desc);
create unique index personal_planner_schedule_link_idx on public.personal_planner_items(schedule_event_id) where schedule_event_id is not null;
create trigger personal_planner_items_touch_updated_at before update on public.personal_planner_items for each row execute function public.touch_updated_at();
alter table public.personal_planner_items enable row level security;

create or replace function public.is_personalized_planner_owner(target_household uuid,target_member uuid,target_type text)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.family_members fm where fm.id=target_member and fm.household_id=target_household and fm.linked_user_id=auth.uid() and fm.status='active' and ((target_type in ('reading','diy') and lower(fm.display_name) like 'samantha%') or (target_type in ('training','fight') and lower(fm.display_name) like 'jason%'))) $$;
revoke all on function public.is_personalized_planner_owner(uuid,uuid,text) from public;
grant execute on function public.is_personalized_planner_owner(uuid,uuid,text) to authenticated;

create policy personal_planner_owner_select on public.personal_planner_items for select using (owner_user_id=auth.uid() and public.is_personalized_planner_owner(household_id,owner_member_id,item_type));
create policy personal_planner_owner_insert on public.personal_planner_items for insert with check (owner_user_id=auth.uid() and public.is_personalized_planner_owner(household_id,owner_member_id,item_type));
create policy personal_planner_owner_update on public.personal_planner_items for update using (owner_user_id=auth.uid() and public.is_personalized_planner_owner(household_id,owner_member_id,item_type)) with check (owner_user_id=auth.uid() and public.is_personalized_planner_owner(household_id,owner_member_id,item_type));
create policy personal_planner_owner_delete on public.personal_planner_items for delete using (owner_user_id=auth.uid() and public.is_personalized_planner_owner(household_id,owner_member_id,item_type));

create or replace function public.link_personal_planner_item_to_schedule(target_item uuid,update_existing boolean default false)
returns uuid language plpgsql security definer set search_path=public
as $$
declare item public.personal_planner_items%rowtype; event_id uuid; zone text; start_at timestamptz; end_at timestamptz;
begin
  select * into item from public.personal_planner_items where id=target_item for update;
  if item.id is null or item.owner_user_id<>auth.uid() or item.item_type not in ('training','fight') or not public.is_personalized_planner_owner(item.household_id,item.owner_member_id,item.item_type) then raise exception 'Not permitted'; end if;
  if public.current_member_role(item.household_id) not in ('household_manager','parent') then raise exception 'Schedule permission required'; end if;
  select time_zone into zone from public.households where id=item.household_id;
  start_at := (item.start_date + item.start_time) at time zone zone;
  end_at := (coalesce(item.end_date,item.start_date) + item.end_time) at time zone zone;
  if end_at<=start_at then raise exception 'End must follow start'; end if;
  if item.schedule_event_id is not null then
    if not update_existing then return item.schedule_event_id; end if;
    update public.schedule_events set title=item.title,description=item.notes,category=case when item.item_type='training' then 'work'::public.event_category else 'family'::public.event_category end,location=item.location,starts_at=start_at,ends_at=end_at,is_all_day=false,all_day_date=null where id=item.schedule_event_id and household_id=item.household_id returning id into event_id;
  else
    insert into public.schedule_events(household_id,created_by_member_id,title,description,category,location,starts_at,ends_at,is_all_day) values(item.household_id,item.owner_member_id,item.title,item.notes,case when item.item_type='training' then 'work'::public.event_category else 'family'::public.event_category end,item.location,start_at,end_at,false) returning id into event_id;
    insert into public.event_participants(event_id,family_member_id) values(event_id,item.owner_member_id) on conflict do nothing;
    update public.personal_planner_items set schedule_event_id=event_id where id=item.id;
  end if;
  return event_id;
end $$;
revoke all on function public.link_personal_planner_item_to_schedule(uuid,boolean) from public;
grant execute on function public.link_personal_planner_item_to_schedule(uuid,boolean) to authenticated;