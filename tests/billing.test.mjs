import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('self-service downgrades preserve role and data, enforce limits and reject upgrades and anonymous access', async () => {
  const db = new PGlite()
  const owner = '00000000-0000-4000-8000-000000000001'
  const other = '00000000-0000-4000-8000-000000000002'
  const query = async (sql, args = []) => (await db.query(sql, args)).rows
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      create table public.profiles(id uuid primary key, role text, plan text, plan_expires_at timestamptz, updated_at timestamptz);
      create table public.products(id int generated always as identity, owner_id uuid, active boolean);
      create table public.plan_audit_log(target_user_id uuid, changed_by uuid, old_plan text, new_plan text, note text);
      alter table profiles enable row level security;
      alter table products enable row level security;
      alter table plan_audit_log enable row level security;
      grant select, update on profiles to authenticated;
      create policy own_profile on profiles for select to authenticated using (id = auth.uid());
      insert into profiles values ('${owner}', 'founder', 'business', now()+interval '30 days', now()), ('${other}', 'seller', 'business', null, now());
      insert into products(owner_id,active) select '${owner}', true from generate_series(1,101);
    `)
    const files = await readdir(new URL('../supabase/migrations/', import.meta.url))
    const migration = files.find(name => name.endsWith('_gulako_self_service_downgrade.sql'))
    assert.ok(migration, 'Downgrade migration is checked in')
    const sql = await readFile(new URL('../supabase/migrations/' + migration, import.meta.url), 'utf8')
    await db.exec(sql)
    await db.exec('set role anon')
    await assert.rejects(query("select public.gulako_downgrade_plan('free')"), /permission denied/)
    await db.exec('reset role; set role authenticated')
    await assert.rejects(query("select public.gulako_downgrade_plan('free')"), /sign in/)
    await db.exec(`set request.jwt.claim.sub='${owner}'`)
    await assert.rejects(query("select public.gulako_downgrade_plan('business')"), /lower plan/)
    await assert.rejects(query("select public.gulako_downgrade_plan(null)"), /lower plan/)
    await assert.rejects(query("select public.gulako_downgrade_plan('free')"), /100 active products/)
    assert.equal((await query("select public.gulako_downgrade_plan('pro') as plan"))[0].plan, 'pro')
    let profile = (await query('select * from profiles'))[0]
    assert.equal(profile.role, 'founder')
    assert.equal(profile.plan, 'pro')
    assert.ok(profile.plan_expires_at)
    await assert.rejects(query("select public.gulako_downgrade_plan('pro')"), /below your current/)
    assert.deepEqual(await query("update profiles set plan='business' returning id"), [])
    await db.exec('reset role')
    await db.exec(`update products set active=false where id=1; set role authenticated; set request.jwt.claim.sub='${owner}'`)
    assert.equal((await query("select public.gulako_downgrade_plan('free') as plan"))[0].plan, 'free')
    await assert.rejects(query("select public.gulako_downgrade_plan('pro')"), /below your current/)
    await db.exec('reset role')
    profile = (await query('select * from profiles where id=$1', [owner]))[0]
    assert.equal(profile.role, 'founder')
    assert.equal(profile.plan_expires_at, null)
    assert.equal((await query('select plan from profiles where id=$1', [other]))[0].plan, 'business')
    assert.equal((await query('select count(*)::int as n from products'))[0].n, 101)
    const audit = await query('select * from plan_audit_log')
    assert.equal(audit.length, 2)
    assert.ok(audit.every(row => row.target_user_id === owner && row.changed_by === owner))
  } finally { await db.close() }
})
