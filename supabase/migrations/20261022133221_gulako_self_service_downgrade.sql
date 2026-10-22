-- A signed-in seller may lower only their own plan. Paid upgrades still need approval.
create schema if not exists gulako_private;
grant usage on schema gulako_private to authenticated;

create or replace function gulako_private.downgrade_plan(target_plan text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  seller_id uuid := auth.uid();
  previous_plan text;
  previous_expiry timestamptz;
  product_count integer;
begin
  if seller_id is null then
    raise exception 'Please sign in before changing your plan.' using errcode = '42501';
  end if;
  if target_plan is null or target_plan not in ('free', 'pro') then
    raise exception 'Choose a lower plan. Paid upgrades require payment approval.' using errcode = '22023';
  end if;

  select p.plan, p.plan_expires_at into previous_plan, previous_expiry
  from public.profiles p where p.id = seller_id for update;
  if not found then
    raise exception 'Your account could not be found.' using errcode = '42501';
  end if;
  if (case target_plan when 'free' then 0 when 'pro' then 1 end)
     >= (case previous_plan when 'free' then 0 when 'pro' then 1 when 'business' then 2 else 0 end) then
    raise exception 'Choose a plan below your current plan. Paid upgrades require payment approval.' using errcode = '22023';
  end if;

  if target_plan = 'free' then
    select count(*) into product_count from public.products where owner_id = seller_id and active is true;
    if product_count > 100 then
      raise exception 'Free supports 100 active products. You currently have %. Reduce your active products before downgrading.', product_count using errcode = '22023';
    end if;
  end if;

  update public.profiles set plan = target_plan,
    plan_expires_at = case when target_plan = 'free' then null else previous_expiry end,
    updated_at = now()
  where id = seller_id;

  insert into public.plan_audit_log(target_user_id, changed_by, old_plan, new_plan, note)
  values (seller_id, seller_id, previous_plan, target_plan, 'Seller confirmed an immediate downgrade in Billing');
  return target_plan;
end;
$$;

revoke all on function gulako_private.downgrade_plan(text) from public, anon;
grant execute on function gulako_private.downgrade_plan(text) to authenticated;

-- Keep privileged code outside the exposed schema; this wrapper uses the caller's permissions.
create or replace function public.gulako_downgrade_plan(target_plan text)
returns text language sql security invoker set search_path = ''
as $$ select gulako_private.downgrade_plan(target_plan); $$;
revoke all on function public.gulako_downgrade_plan(text) from public, anon;
grant execute on function public.gulako_downgrade_plan(text) to authenticated;
