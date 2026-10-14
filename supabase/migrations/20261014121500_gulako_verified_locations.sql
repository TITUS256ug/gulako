-- Founder-controlled verified location for Business-plan shops.
-- Run on Gulako's Supabase project (NOT Nile Core or NileFlow) BEFORE deploying frontend.
-- No seller-facing column on public.shops can be toggled to grant verification.
create table if not exists public.gulako_shop_verifications (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  verified_at timestamptz not null default now(),
  verified_by uuid not null references auth.users(id),
  location_snapshot text not null,
  maps_link_snapshot text not null,
  review_note text not null
);
create table if not exists public.gulako_shop_verification_audit (
  id bigint generated always as identity primary key,
  shop_id uuid not null,
  action text not null check (action in ('verified','revoked','location_changed','plan_changed')),
  actor_id uuid,
  review_note text,
  happened_at timestamptz not null default now()
);
alter table public.gulako_shop_verifications enable row level security;
alter table public.gulako_shop_verification_audit enable row level security;
revoke all on table public.gulako_shop_verifications from anon, authenticated;
revoke all on table public.gulako_shop_verification_audit from anon, authenticated;

-- RLS never depends on client-provided plan flags or a client-editable verified boolean.
create or replace function public.gulako_verification_eligible(p_shop_id uuid,p_location text,p_maps_link text)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists (
    select 1 from public.shops s join public.profiles p on p.id=s.owner_id
    where s.id=p_shop_id and s.published is true and p.plan='business'
      and nullif(btrim(s.location),'') is not null
      and nullif(btrim(s.maps_link),'') is not null
      and s.location is not distinct from p_location
      and s.maps_link is not distinct from p_maps_link
  );
$$;
revoke all on function public.gulako_verification_eligible(uuid,text,text) from public;
grant execute on function public.gulako_verification_eligible(uuid,text,text) to anon,authenticated;

create policy "Only current paid reviewed locations are public"
  on public.gulako_shop_verifications for select to anon,authenticated
  using (public.gulako_verification_eligible(shop_id,location_snapshot,maps_link_snapshot));
grant select (shop_id,verified_at) on public.gulako_shop_verifications to anon,authenticated;

-- Founder-only read: one row per shop with derived, never client-editable verification.
create or replace function public.gulako_founder_shops_for_verification()
returns table(
  shop_id uuid, owner_id uuid, business_name text, slug text,
  location text, maps_link text, plan text, is_verified boolean, verified_at timestamptz
)
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
  if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('founder','admin')) then
    raise exception 'Founder access required' using errcode='42501';
  end if;
  return query
    select s.id,s.owner_id,s.business_name::text,s.slug::text,s.location::text,s.maps_link::text,
      p.plan::text,
      (v.shop_id is not null and public.gulako_verification_eligible(s.id,v.location_snapshot,v.maps_link_snapshot)) as is_verified,
      case when public.gulako_verification_eligible(s.id,v.location_snapshot,v.maps_link_snapshot)
        then v.verified_at else null end as verified_at
    from public.shops s
    join public.profiles p on p.id=s.owner_id
    left join public.gulako_shop_verifications v on v.shop_id=s.id
    order by s.created_at desc;
end;
$$;
revoke all on function public.gulako_founder_shops_for_verification() from public,anon;
grant execute on function public.gulako_founder_shops_for_verification() to authenticated;

create or replace function public.gulako_set_shop_verified(
  p_shop_id uuid,p_verified boolean,p_review_note text
)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare s record; note_clean text:=btrim(coalesce(p_review_note,''));
begin
  if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('founder','admin')) then
    raise exception 'Founder access required' using errcode='42501';
  end if;
  if p_shop_id is null or p_verified is null or length(note_clean)<8 or length(note_clean)>500 then
    raise exception 'Provide a shop, a decision and an 8-500 character review note';
  end if;
  select sh.location,sh.maps_link,sh.published,p.plan
  into s from public.shops sh join public.profiles p on p.id=sh.owner_id
  where sh.id=p_shop_id for update of sh;
  if not found then raise exception 'Shop not found'; end if;
  if p_verified then
    if s.plan<>'business' or s.published is not true
      or nullif(btrim(s.location),'') is null or nullif(btrim(s.maps_link),'') is null then
      raise exception 'A published Business-plan shop with complete location and directions is required';
    end if;
    insert into public.gulako_shop_verifications
      (shop_id,verified_at,verified_by,location_snapshot,maps_link_snapshot,review_note)
    values (p_shop_id,now(),auth.uid(),s.location,s.maps_link,note_clean)
    on conflict(shop_id) do update set
      verified_at=excluded.verified_at, verified_by=excluded.verified_by,
      location_snapshot=excluded.location_snapshot,
      maps_link_snapshot=excluded.maps_link_snapshot,review_note=excluded.review_note;
  else
    delete from public.gulako_shop_verifications where shop_id=p_shop_id;
  end if;
  insert into public.gulako_shop_verification_audit(shop_id,action,actor_id,review_note)
  values(p_shop_id,case when p_verified then 'verified' else 'revoked' end,auth.uid(),note_clean);
  return true;
end;
$$;
revoke all on function public.gulako_set_shop_verified(uuid,boolean,text) from public,anon;
grant execute on function public.gulako_set_shop_verified(uuid,boolean,text) to authenticated;

-- Any seller edit of an approved location / directions revokes its certificate.
create or replace function public.gulako_unverify_shop_after_location_change()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if old.location is distinct from new.location
     or old.maps_link is distinct from new.maps_link
     or old.owner_id is distinct from new.owner_id then
    with deleted as (
      delete from public.gulako_shop_verifications
      where shop_id=new.id returning shop_id
    )
    insert into public.gulako_shop_verification_audit(shop_id,action,review_note)
    select shop_id,'location_changed','Shop location, directions or ownership changed' from deleted;
  end if;
  return new;
end;
$$;
create trigger gulako_unverify_on_location_change
  after update of location,maps_link,owner_id on public.shops
  for each row execute function public.gulako_unverify_shop_after_location_change();

create or replace function public.gulako_unverify_after_plan_change()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.plan is distinct from old.plan and new.plan <> 'business' then
    with deleted as (
      delete from public.gulako_shop_verifications v
      using public.shops sh where sh.id=v.shop_id and sh.owner_id=new.id
      returning v.shop_id
    )
    insert into public.gulako_shop_verification_audit(shop_id,action,review_note)
    select shop_id,'plan_changed','Business plan no longer active' from deleted;
  end if;
  return new;
end;
$$;
create trigger gulako_unverify_on_plan_change
  after update of plan on public.profiles
  for each row execute function public.gulako_unverify_after_plan_change();

-- Test before release: authenticated seller cannot insert/update/delete;
-- anon sees only eligible rows; Free/Pro cannot be verified; location change
-- and downgrade revoke; founder can verify/revoke with an audit note.
