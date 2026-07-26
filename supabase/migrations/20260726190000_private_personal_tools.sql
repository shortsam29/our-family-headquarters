create table public.personal_brain_dump_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text check (title is null or char_length(title) <= 160),
  note text not null check (char_length(note) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.personal_wish_list_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null check (char_length(item_name) between 1 and 200),
  store_website text check (store_website is null or char_length(store_website) <= 300),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index personal_brain_dump_owner_created_idx on public.personal_brain_dump_notes(owner_user_id,created_at desc);
create index personal_wish_list_owner_created_idx on public.personal_wish_list_items(owner_user_id,created_at desc);

alter table public.personal_brain_dump_notes enable row level security;
alter table public.personal_wish_list_items enable row level security;

create policy brain_dump_owner_select on public.personal_brain_dump_notes for select using (owner_user_id=auth.uid() and public.is_household_member(household_id));
create policy brain_dump_owner_insert on public.personal_brain_dump_notes for insert with check (owner_user_id=auth.uid() and public.is_household_member(household_id));
create policy brain_dump_owner_update on public.personal_brain_dump_notes for update using (owner_user_id=auth.uid() and public.is_household_member(household_id)) with check (owner_user_id=auth.uid() and public.is_household_member(household_id));
create policy brain_dump_owner_delete on public.personal_brain_dump_notes for delete using (owner_user_id=auth.uid() and public.is_household_member(household_id));

create policy wish_list_owner_select on public.personal_wish_list_items for select using (owner_user_id=auth.uid() and public.is_household_member(household_id));
create policy wish_list_owner_insert on public.personal_wish_list_items for insert with check (owner_user_id=auth.uid() and public.is_household_member(household_id));
create policy wish_list_owner_update on public.personal_wish_list_items for update using (owner_user_id=auth.uid() and public.is_household_member(household_id)) with check (owner_user_id=auth.uid() and public.is_household_member(household_id));
create policy wish_list_owner_delete on public.personal_wish_list_items for delete using (owner_user_id=auth.uid() and public.is_household_member(household_id));

create trigger personal_brain_dump_touch_updated_at before update on public.personal_brain_dump_notes for each row execute function public.touch_updated_at();
create trigger personal_wish_list_touch_updated_at before update on public.personal_wish_list_items for each row execute function public.touch_updated_at();
