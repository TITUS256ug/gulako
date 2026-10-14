import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'
import handler from '../api/describe-product.js'

test('growth migration: validation, attribution, owner isolation and AI quota',async()=>{
 const db=new PGlite()
 try{
 await db.exec(`
 create role anon; create role authenticated;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;
 create table public.profiles(id uuid primary key references auth.users(id), plan text not null default 'free', plan_expires_at timestamptz);\n create table public.shops(id uuid primary key,owner_id uuid references auth.users,slug text unique,published boolean);
 create table public.orders(id uuid primary key default gen_random_uuid(),shop_id uuid references shops,owner_id uuid,total numeric,status text);
 alter table orders enable row level security;
 create policy orders_owner on orders for select to authenticated using(owner_id=auth.uid());
 grant select on shops to anon,authenticated; grant select on orders to authenticated;
 create function public.create_public_order(shop_slug text,buyer_name text,buyer_phone text,buyer_location text,buyer_note text,pay_method text,pay_reference text,items jsonb) returns jsonb language plpgsql security definer as $$
 declare result uuid;
 begin
 insert into public.orders(shop_id,owner_id,total,status) select id,owner_id,100,'completed' from public.shops where slug=shop_slug returning id into result;
 return jsonb_build_object('id',result,'public_ref','test-only'); end $$;
 insert into auth.users values('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');\n insert into public.profiles(id,plan) values('00000000-0000-4000-8000-000000000001','business'),('00000000-0000-4000-8000-000000000002','free');
 insert into shops values('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','alpha',true),('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','beta',true),('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','hidden',false);
 `)
 await db.exec(await readFile(new URL('../supabase/migrations/20261012120522_gulako_business_growth.sql',import.meta.url),'utf8'))
 const q=async(sql,args=[]) => (await db.query(sql,args)).rows
 await assert.rejects(db.exec(`update shops set opening_hours='[{"day":"Monday","status":"open","opens":"25:00","closes":"18:00"}]'`),/check constraint/)
 await db.exec(`update shops set faqs='[{"question":"Delivery?","answer":"Pickup only"}]',opening_hours='[{"day":"Monday","status":"open","opens":"22:00","closes":"06:00"}]' where slug='alpha'`)
 const visit='20000000-0000-4000-8000-000000000001', event='30000000-0000-4000-8000-000000000001'
 const record=async(slug='alpha',v=visit,e=event)=>q('select record_gulako_event($1,$2,$3,$4,$5,$6)',[slug,v,e,'checkout_start','chatgpt','launch'])
 const order=async(slug='alpha',v=visit)=>q("select create_attributed_order($1,'Buyer','123','Pickup','','other','','[{}]'::jsonb,$2)",[slug,v])
 await db.exec('set role anon')
 await record();await record();await record('beta');await record('hidden','20000000-0000-4000-8000-000000000002')
 await assert.rejects(q('select * from gulako_visits'),/permission denied/)
 await order();await order('beta')
 await assert.rejects(q('select gulako_traffic_report(30)'),/permission denied/)
 await db.exec('reset role')
 assert.equal((await q('select count(*)::int n from gulako_events'))[0].n,1)
 assert.equal((await q('select count(*)::int n from gulako_visits'))[0].n,1)
 assert.equal((await q('select count(*)::int n from orders where visit_id is not null'))[0].n,1)
 await db.exec("set role authenticated; set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001'")
 await record('alpha','20000000-0000-4000-8000-000000000009','30000000-0000-4000-8000-000000000009')
 const report=(await q('select gulako_traffic_report(30) r'))[0].r
 assert.equal(report.sessions,1);assert.equal(report.orders,1);assert.equal(report.convertedSessions,1);assert.equal(report.completedRevenue,100)
 assert.equal(report.sources[0].source,'chatgpt')
 await assert.rejects(q("insert into gulako_visits(id,shop_id,source) values(gen_random_uuid(),'10000000-0000-4000-8000-000000000001','direct')"),/permission denied/)
 for(let i=0;i<20;i++)assert.equal((await q('select gulako_description_quota() allowed'))[0].allowed,true)
 assert.equal((await q('select gulako_description_quota() allowed'))[0].allowed,false)
 await db.exec("set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002'")
 assert.equal((await q('select gulako_traffic_report(30) r'))[0].r.sessions,0)
 assert.equal((await q('select count(*)::int n from gulako_description_usage'))[0].n,0)
 await db.exec('reset role');await db.exec("set request.jwt.claim.sub=''; update gulako_visits set last_seen_at=now()-interval '31 minutes'")
 await db.exec('set role anon');await record('alpha',visit,'30000000-0000-4000-8000-000000000008');await order()
 await db.exec('reset role')
 assert.equal((await q('select count(*)::int n from gulako_events'))[0].n,1)
 assert.equal((await q('select count(*)::int n from orders where visit_id is not null'))[0].n,1)
 }finally{await db.close()}
})

test('AI endpoint rejects unsupported, unauthenticated and malformed requests before provider calls',async()=>{
 for(const [req,expected] of [[{method:'GET',headers:{}},405],[{method:'POST',headers:{},body:{}},401],[{method:'POST',headers:{authorization:'Bearer test'},body:'{bad'},400]]){
 const res={setHeader(){},status(n){this.code=n;return this},json(body){this.body=body;return this}}
 await handler(req,res);assert.equal(res.code,expected)
 }
})
