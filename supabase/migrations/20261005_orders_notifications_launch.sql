-- Gulako launch orders + seller notifications
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  public_ref text not null unique default ('GLK-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  shop_id uuid not null references public.shops(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  delivery_location text not null default '',
  customer_note text not null default '',
  subtotal numeric not null default 0 check (subtotal >= 0),
  total numeric not null default 0 check (total >= 0),
  currency text not null default 'UGX',
  payment_method text not null default 'other' check (payment_method in ('mtn','airtel','other')),
  payment_reference text not null default '',
  payment_status text not null default 'reported' check (payment_status in ('unverified','reported','confirmed')),
  status text not null default 'new' check (status in ('new','confirmed','processing','delivering','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  image_url text not null default '',
  quantity integer not null check (quantity > 0 and quantity <= 99),
  unit_price numeric not null check (unit_price >= 0),
  line_total numeric not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'info',
  title text not null,
  body text not null default '',
  href text not null default '/dashboard',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists orders_owner_created_idx on public.orders(owner_id, created_at desc);
create index if not exists orders_shop_created_idx on public.orders(shop_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.notifications enable row level security;

drop policy if exists orders_owner_select on public.orders;
create policy orders_owner_select on public.orders for select to authenticated using (owner_id = auth.uid());
drop policy if exists orders_owner_update on public.orders;
create policy orders_owner_update on public.orders for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists order_items_owner_select on public.order_items;
create policy order_items_owner_select on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id=order_items.order_id and o.owner_id=auth.uid()));
drop policy if exists notifications_owner_select on public.notifications;
create policy notifications_owner_select on public.notifications for select to authenticated using (user_id=auth.uid());
drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update on public.notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create or replace function public.create_public_order(shop_slug text,buyer_name text,buyer_phone text,buyer_location text,buyer_note text,pay_method text,pay_reference text,items jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_shop public.shops%rowtype; v_order public.orders%rowtype; v_item jsonb; v_product public.products%rowtype; v_qty integer; v_subtotal numeric:=0;
begin
  if nullif(trim(buyer_name),'') is null then raise exception 'Customer name is required'; end if;
  if nullif(trim(buyer_phone),'') is null then raise exception 'Customer phone is required'; end if;
  if jsonb_typeof(items)<>'array' or jsonb_array_length(items)=0 then raise exception 'Order has no items'; end if;
  select * into v_shop from public.shops where slug=lower(trim(shop_slug)) and published=true;
  if not found then raise exception 'Shop not found'; end if;
  insert into public.orders(shop_id,owner_id,customer_name,customer_phone,delivery_location,customer_note,subtotal,total,currency,payment_method,payment_reference,payment_status,status)
  values(v_shop.id,v_shop.owner_id,left(trim(buyer_name),120),left(trim(buyer_phone),60),left(coalesce(trim(buyer_location),''),240),left(coalesce(trim(buyer_note),''),600),0,0,'UGX',case when pay_method in ('mtn','airtel','other') then pay_method else 'other' end,left(coalesce(trim(pay_reference),''),120),case when nullif(trim(coalesce(pay_reference,'')),'') is null then 'unverified' else 'reported' end,'new') returning * into v_order;
  for v_item in select value from jsonb_array_elements(items) loop
    v_qty:=greatest(1,least(99,coalesce((v_item->>'quantity')::integer,1)));
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid and shop_id=v_shop.id and active=true;
    if not found then raise exception 'A product in this order is unavailable'; end if;
    if v_product.stock<v_qty then raise exception '% does not have enough stock',v_product.name; end if;
    insert into public.order_items(order_id,product_id,product_name,image_url,quantity,unit_price,line_total) values(v_order.id,v_product.id,v_product.name,coalesce(v_product.image_url,''),v_qty,v_product.price,v_product.price*v_qty);
    v_subtotal:=v_subtotal+(v_product.price*v_qty);
  end loop;
  update public.orders set subtotal=v_subtotal,total=v_subtotal,updated_at=now() where id=v_order.id returning * into v_order;
  return jsonb_build_object('id',v_order.id,'public_ref',v_order.public_ref,'total',v_order.total,'currency',v_order.currency,'status',v_order.status);
end $$;

create or replace function public.get_public_order(order_ref text)
returns jsonb language sql security definer set search_path=public stable as $$
select jsonb_build_object('public_ref',o.public_ref,'shop_name',s.business_name,'shop_slug',s.slug,'status',o.status,'payment_status',o.payment_status,'total',o.total,'currency',o.currency,'created_at',o.created_at,'updated_at',o.updated_at,'items',coalesce((select jsonb_agg(jsonb_build_object('name',oi.product_name,'quantity',oi.quantity,'unit_price',oi.unit_price,'line_total',oi.line_total,'image_url',oi.image_url) order by oi.created_at) from public.order_items oi where oi.order_id=o.id),'[]'::jsonb))
from public.orders o join public.shops s on s.id=o.shop_id where upper(o.public_ref)=upper(trim(order_ref)) limit 1;
$$;

create or replace function public.notify_new_order() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.notifications(user_id,kind,title,body,href) values(new.owner_id,'order','New order '||new.public_ref,'A customer placed a new order. Open Orders to review it.','/dashboard/orders?order='||new.id::text);
 return new;
end $$;
drop trigger if exists orders_notify_insert on public.orders;
create trigger orders_notify_insert after insert on public.orders for each row execute function public.notify_new_order();

create or replace function public.notify_plan_request_result() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.status is distinct from new.status and new.status in ('approved','rejected') then
  insert into public.notifications(user_id,kind,title,body,href) values(new.user_id,'billing',case when new.status='approved' then 'Plan upgrade approved' else 'Plan upgrade update' end,case when new.status='approved' then 'Your Gulako plan upgrade has been approved.' else 'Your plan upgrade request was not approved. Open Billing for details.' end,'/dashboard/billing');
 end if;
 return new;
end $$;
drop trigger if exists plan_upgrade_notify_status on public.plan_upgrade_requests;
create trigger plan_upgrade_notify_status after update of status on public.plan_upgrade_requests for each row execute function public.notify_plan_request_result();

revoke all on function public.create_public_order(text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.create_public_order(text,text,text,text,text,text,text,jsonb) to anon,authenticated;
revoke all on function public.get_public_order(text) from public;
grant execute on function public.get_public_order(text) to anon,authenticated;
revoke update on public.orders from authenticated;
grant update(status,payment_status,updated_at) on public.orders to authenticated;
revoke update on public.notifications from authenticated;
grant update(read_at) on public.notifications to authenticated;
