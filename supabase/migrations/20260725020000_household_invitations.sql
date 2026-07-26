-- Secure single-use household join codes tied to an existing family-member profile.
create type public.household_invitation_status as enum ('active','redeemed','disabled');
create table public.household_invitations (
 id uuid primary key default gen_random_uuid(),
 household_id uuid not null references public.households(id) on delete cascade,
 family_member_id uuid not null references public.family_members(id) on delete cascade,
 code_hash bytea not null unique,
 status public.household_invitation_status not null default 'active',
 expires_at timestamptz not null,
 created_by_member_id uuid not null references public.family_members(id) on delete restrict,
 redeemed_by_user_id uuid references auth.users(id) on delete set null,
 redeemed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (expires_at > created_at),
 check ((status='redeemed' and redeemed_by_user_id is not null and redeemed_at is not null) or (status<>'redeemed' and redeemed_at is null))
);
create unique index household_invitations_active_member_idx on public.household_invitations(family_member_id) where status='active';
create index household_invitations_household_status_idx on public.household_invitations(household_id,status,expires_at);
create trigger household_invitations_touch_updated_at before update on public.household_invitations for each row execute function public.touch_updated_at();
alter table public.household_invitations enable row level security;
create policy household_invitations_read on public.household_invitations for select using (public.current_member_role(household_id) in ('household_manager','parent'));
create policy household_invitations_create on public.household_invitations for insert with check (
 public.current_member_role(household_id) in ('household_manager','parent')
 and created_by_member_id=public.current_family_member_id(household_id)
 and exists(select 1 from public.family_members fm where fm.id=family_member_id and fm.household_id=household_id and fm.status='active' and fm.linked_user_id is null and fm.role<>'household_manager')
);
create policy household_invitations_update on public.household_invitations for update using (public.current_member_role(household_id) in ('household_manager','parent')) with check (public.current_member_role(household_id) in ('household_manager','parent'));

create or replace function public.validate_household_invitation(invitation_code text) returns boolean language sql security definer set search_path=public stable as $$
 select exists(select 1 from public.household_invitations hi join public.family_members fm on fm.id=hi.family_member_id where hi.code_hash=extensions.digest(upper(trim(invitation_code)),'sha256') and hi.status='active' and hi.expires_at>now() and fm.status='active' and fm.linked_user_id is null);
$$;
revoke all on function public.validate_household_invitation(text) from public;
grant execute on function public.validate_household_invitation(text) to anon,authenticated;

create or replace function public.redeem_household_invitation(invitation_code text) returns uuid language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); invitation public.household_invitations%rowtype;
begin
 if actor is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.household_memberships where user_id=actor and status='active') then raise exception 'Account already belongs to a household'; end if;
 select * into invitation from public.household_invitations where code_hash=extensions.digest(upper(trim(invitation_code)),'sha256') and status='active' and expires_at>now() for update;
 if invitation.id is null then raise exception 'Invitation unavailable'; end if;
 update public.family_members set linked_user_id=actor,updated_at=now() where id=invitation.family_member_id and household_id=invitation.household_id and status='active' and linked_user_id is null;
 if not found then raise exception 'Family member unavailable'; end if;
 insert into public.household_memberships(household_id,user_id,family_member_id,status) values(invitation.household_id,actor,invitation.family_member_id,'active');
 insert into public.user_profiles(family_member_id) values(invitation.family_member_id) on conflict(family_member_id) do nothing;
 update public.household_invitations set status='redeemed',redeemed_by_user_id=actor,redeemed_at=now(),updated_at=now() where id=invitation.id;
 return invitation.household_id;
end;$$;
revoke all on function public.redeem_household_invitation(text) from public;
grant execute on function public.redeem_household_invitation(text) to authenticated;

create or replace function public.archive_household_member(target_member_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare target public.family_members%rowtype; actor_role public.member_role; actor_member uuid;
begin
 select * into target from public.family_members where id=target_member_id for update;
 if target.id is null then raise exception 'Family member unavailable'; end if;
 actor_role:=public.current_member_role(target.household_id); actor_member:=public.current_family_member_id(target.household_id);
 if actor_role not in ('household_manager','parent') then raise exception 'Permission denied'; end if;
 if target.id=actor_member or target.role='household_manager' then raise exception 'Protected household member'; end if;
 update public.household_memberships set status='inactive',updated_at=now() where family_member_id=target.id and status='active';
 update public.household_invitations set status='disabled',updated_at=now() where family_member_id=target.id and status='active';
 update public.family_members set status='archived',updated_at=now() where id=target.id;
end;$$;
revoke all on function public.archive_household_member(uuid) from public;
grant execute on function public.archive_household_member(uuid) to authenticated;
