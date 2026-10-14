-- Additive Gulako growth features. Apply only to Gulako's existing project.
begin;
alter table public.shops add column if not exists faqs jsonb not null default '[]';
alter table public.shops add column if not exists opening_hours jsonb not null default '[]';
alter table public.shops add column if not exists timezone text not null default 'Africa/Kampala';

create schema if not exists gulako_private;
revoke all on schema gulako_private from public;
grant usage on schema gulako_private to anon,authenticated;

create or replace function gulako_private.valid_business_details(faqs jsonb,hours jsonb,tz text)
returns boolean language plpgsql immutable set search_path='' as $$
declare item jsonb; days text[]:='{}'; d text;
begin
 if jsonb_typeof(faqs) is distinct from 'array' or jsonb_typeof(hours) is distinct from 'array' then return false; end if;
 if jsonb_array_length(faqs)>10 or jsonb_array_length(hours)>7 or tz not in ('Africa/Kampala','Africa/Nairobi','Africa/Kigali','Africa/Lagos','Africa/Johannesburg','Europe/London','America/New_York','UTC') then return false; end if;
 for item in select value from jsonb_array_elements(faqs) loop
  if jsonb_typeof(item->'question') is distinct from 'string' or jsonb_typeof(item->'answer') is distinct from 'string' or length(trim(item->>'question')) not between 1 and 200 or length(trim(item->>'answer')) not between 1 and 1500 then return false; end if;
 end loop;
 for item in select value from jsonb_array_elements(hours) loop
  d:=item->>'day';
  if d is null or d not in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') or d=any(days) or coalesce(item->>'status','') not in ('open','closed') then return false; end if;
  days:=array_append(days,d);
  if item->>'status'='open' and (coalesce(item->>'opens','')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(item->>'closes','')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' or item->>'opens'=item->>'closes') then return false; end if;
 end loop;
 return true;
end $$;
revoke all on function gulako_private.valid_business_details(jsonb,jsonb,text) from public;
grant execute on function gulako_private.valid_business_details(jsonb,jsonb,text) to anon,authenticated;
alter table public.shops add constraint gulako_business_details_valid check(gulako_private.valid_business_details(faqs,opening_hours,timezone));

create table public.gulako_visits (
 id uuid primary key,
 shop_id uuid not null references public.shops(id) on delete cascade,
 source text not null check(source in ('google','bing','chatgpt','perplexity','social','campaign','referral','direct')),
 campaign text not null default '' check(length(campaign)<=80),
 started_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now()
);
create table public.gulako_events (
 id uuid primary key,
 visit_id uuid not null references public.gulako_visits(id) on delete cascade,
 kind text not null check(kind in ('shop_view','product_view','cart_add','checkout_start','whatsapp_click')),
 created_at timestamptz not null default now()
);
create index gulako_visits_shop_time_idx on public.gulako_visits(shop_id,started_at desc);
create index gulako_events_visit_idx on public.gulako_events(visit_id,kind);
alter table public.orders add column if not exists visit_id uuid references public.gulako_visits(id) on delete set null;
create index if not exists gulako_orders_visit_idx on public.orders(visit_id) where visit_id is not null;
alter table public.gulako_visits enable row level security;
alter table public.gulako_events enable row level security;
create policy gulako_visits_owner_read on public.gulako_visits for select to authenticated using(exists(select 1 from public.shops s where s.id=shop_id and s.owner_id=(select auth.uid())));
create policy gulako_events_owner_read on public.gulako_events for select to authenticated using(exists(select 1 from public.gulako_visits v join public.shops s on s.id=v.shop_id where v.id=visit_id and s.owner_id=(select auth.uid())));
revoke all on public.gulako_visits,public.gulako_events from anon,authenticated;
grant select on public.gulako_visits,public.gulako_events to authenticated;

-- Anonymous visitors are intentionally supported, but only for published shops.
-- Definer helpers live outside the exposed public schema; no arbitrary SQL or owner input.
create or replace function gulako_private.record_event(shop_slug text,visit_token uuid,event_token uuid,event_kind text,traffic_source text,campaign_name text)
returns void language plpgsql security definer set search_path='' as $$
declare s public.shops%rowtype; v public.gulako_visits%rowtype;
begin
 if visit_token is null or event_token is null or event_kind not in ('shop_view','product_view','cart_add','checkout_start','whatsapp_click') then return; end if;
 select * into s from public.shops where slug=shop_slug and published=true;
 if not found or s.owner_id=auth.uid() then return; end if;
 insert into public.gulako_visits(id,shop_id,source,campaign) values(visit_token,s.id,case when traffic_source in ('google','bing','chatgpt','perplexity','social','campaign','referral') then traffic_source else 'direct' end,left(regexp_replace(coalesce(campaign_name,''),'[^a-zA-Z0-9 _.-]','','g'),80)) on conflict(id) do nothing;
 select * into v from public.gulako_visits where id=visit_token for update;
 if v.shop_id<>s.id or v.last_seen_at<now()-interval '30 minutes' or v.started_at<now()-interval '24 hours' then return; end if;
 if (select count(*) from public.gulako_events where visit_id=visit_token)>=500 then return; end if;
 insert into public.gulako_events(id,visit_id,kind) values(event_token,visit_token,event_kind) on conflict(id) do nothing;
 update public.gulako_visits set last_seen_at=now() where id=visit_token;
end $$;
create or replace function public.record_gulako_event(shop_slug text,visit_token uuid,event_token uuid,event_kind text,traffic_source text,campaign_name text)
returns void language sql security invoker set search_path='' as $$ select gulako_private.record_event(shop_slug,visit_token,event_token,event_kind,traffic_source,campaign_name); $$;
revoke all on function gulako_private.record_event(text,uuid,uuid,text,text,text),public.record_gulako_event(text,uuid,uuid,text,text,text) from public;
grant execute on function gulako_private.record_event(text,uuid,uuid,text,text,text),public.record_gulako_event(text,uuid,uuid,text,text,text) to anon,authenticated;

create or replace function gulako_private.attributed_order(shop_slug text,buyer_name text,buyer_phone text,buyer_location text,buyer_note text,pay_method text,pay_reference text,items jsonb,visit_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; shop public.shops%rowtype;
begin
 if jsonb_typeof(items) is distinct from 'array' then raise exception 'Invalid order items'; end if;
 if jsonb_array_length(items) not between 1 and 100 then raise exception 'Invalid number of order items'; end if;
 select * into shop from public.shops where slug=shop_slug and published=true;
 if not found then raise exception 'Shop is unavailable'; end if;
 result:=public.create_public_order(shop_slug,buyer_name,buyer_phone,buyer_location,buyer_note,pay_method,pay_reference,items);
 if shop.owner_id is distinct from auth.uid() and visit_token is not null then
  update public.orders set visit_id=visit_token where id=(result->>'id')::uuid and shop_id=shop.id and exists(select 1 from public.gulako_visits v where v.id=visit_token and v.shop_id=shop.id and v.last_seen_at>=now()-interval '30 minutes' and v.started_at>=now()-interval '24 hours');
 end if;
 return result;
end $$;
create or replace function public.create_attributed_order(shop_slug text,buyer_name text,buyer_phone text,buyer_location text,buyer_note text,pay_method text,pay_reference text,items jsonb,visit_token uuid default null)
returns jsonb language sql security invoker set search_path='' as $$ select gulako_private.attributed_order(shop_slug,buyer_name,buyer_phone,buyer_location,buyer_note,pay_method,pay_reference,items,visit_token); $$;
revoke all on function gulako_private.attributed_order(text,text,text,text,text,text,text,jsonb,uuid),public.create_attributed_order(text,text,text,text,text,text,text,jsonb,uuid) from public;
grant execute on function gulako_private.attributed_order(text,text,text,text,text,text,text,jsonb,uuid),public.create_attributed_order(text,text,text,text,text,text,text,jsonb,uuid) to anon,authenticated;

create or replace function public.gulako_traffic_report(lookback_days integer default 30)
returns jsonb language sql stable security invoker set search_path='' as $$
with visits as (select v.* from public.gulako_visits v join public.shops s on s.id=v.shop_id where s.owner_id=(select auth.uid()) and v.started_at>=now()-make_interval(days=>greatest(1,least(90,lookback_days)))),
events as (select e.* from public.gulako_events e join visits v on v.id=e.visit_id),
orders as (select o.* from public.orders o join visits v on v.id=o.visit_id),
sources as (select v.source,count(distinct v.id) sessions,count(distinct o.id) orders from visits v left join orders o on o.visit_id=v.id group by v.source)
select jsonb_build_object('sessions',(select count(*) from visits),'productSessions',(select count(distinct visit_id) from events where kind='product_view'),'cartSessions',(select count(distinct visit_id) from events where kind='cart_add'),'checkoutSessions',(select count(distinct visit_id) from events where kind='checkout_start'),'whatsappSessions',(select count(distinct visit_id) from events where kind='whatsapp_click'),'convertedSessions',(select count(distinct visit_id) from orders),'orders',(select count(*) from orders),'completedRevenue',coalesce((select sum(total) from orders where status='completed'),0),'sources',coalesce((select jsonb_agg(jsonb_build_object('source',source,'sessions',sessions,'orders',orders) order by sessions desc) from sources),'[]'::jsonb),'since',now()-make_interval(days=>greatest(1,least(90,lookback_days))));
$$;
revoke all on function public.gulako_traffic_report(integer) from public,anon;
grant execute on function public.gulako_traffic_report(integer) to authenticated;

create table public.gulako_description_usage (
 user_id uuid not null references auth.users(id) on delete cascade,
 usage_date date not null default (now() at time zone 'UTC')::date,
 requests integer not null default 0 check(requests between 0 and 20),
 primary key(user_id,usage_date)
);
alter table public.gulako_description_usage enable row level security;
revoke all on public.gulako_description_usage from anon,authenticated;
grant select on public.gulako_description_usage to authenticated;
create policy gulako_description_usage_owner on public.gulako_description_usage for select to authenticated using(user_id=(select auth.uid()));
create or replace function gulako_private.description_quota()
returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); usage_day date:=(now() at time zone 'UTC')::date; used integer;
begin
 if uid is null or not exists(select 1 from public.shops s join public.profiles p on p.id=s.owner_id where s.owner_id=uid and p.plan='business' and (p.plan_expires_at is null or p.plan_expires_at > now())) then raise exception 'An active Business plan and a seller shop are required'; end if;
 insert into public.gulako_description_usage(user_id,usage_date,requests) values(uid,usage_day,1)
 on conflict(user_id,usage_date) do update set requests=public.gulako_description_usage.requests+1 where public.gulako_description_usage.requests<20 returning requests into used;
 return used is not null;
end $$;
create or replace function public.gulako_description_quota() returns boolean language sql security invoker set search_path='' as $$ select gulako_private.description_quota(); $$;
revoke all on function gulako_private.description_quota(),public.gulako_description_quota() from public,anon;
grant execute on function gulako_private.description_quota(),public.gulako_description_quota() to authenticated;
notify pgrst,'reload schema';
commit;
