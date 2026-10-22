import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { checkoutErrorMessage, stockIssue } from '../src/lib/checkoutValidation.ts'

test('checkout shows stock errors returned as plain PostgREST objects without exposing internal database failures', () => {
  assert.match(checkoutErrorMessage({code:'P0001',message:'Carrot scrub does not have enough stock'}), /Carrot scrub does not have enough stock.*Reduce/)
  assert.match(checkoutErrorMessage(new Error('Scrub: only 6 available. Reduce the quantity in your cart to continue.')), /only 6 available/)
  assert.match(checkoutErrorMessage({code:'P0001',message:'A product in this order is unavailable'}), /no longer available/)
  assert.doesNotMatch(checkoutErrorMessage({code:'42501',message:'permission denied for secret_table'}), /secret_table/)
  assert.match(checkoutErrorMessage({}), /cart is saved/)
})

test('stock checks accept the exact available quantity and block excessive, missing and invalid quantities', () => {
  const product={id:'test',name:'Scrub',stock:6,shopSlug:'shop'}
  assert.equal(stockIssue('Scrub',6,product),null)
  assert.match(stockIssue('Scrub',7,product),/only 6 available/)
  assert.match(stockIssue('Scrub',1,{...product,stock:0}),/out of stock/)
  assert.match(stockIssue('Scrub',1),/no longer available/)
  for(const quantity of [0,-1,1.5,100,NaN])assert.match(stockIssue('Scrub',quantity,product),/between 1 and 99/)
})

test('the order function accepts UGX 474,000 with valid stock and rolls back a stock failure without a partial order', async () => {
  const db=new PGlite()
  try{
    await db.exec(`
      create table shops(id uuid primary key,owner_id uuid,slug text,published boolean);
      create table products(id uuid primary key,shop_id uuid,name text,stock integer,active boolean,image_url text,price numeric);
      create table orders(id uuid primary key default gen_random_uuid(),public_ref text default ('GLK-'||gen_random_uuid()::text),shop_id uuid,owner_id uuid,customer_name text,customer_phone text,delivery_location text,customer_note text,subtotal numeric,total numeric,currency text,payment_method text,payment_reference text,payment_status text,status text,updated_at timestamptz);
      create table order_items(order_id uuid references orders on delete cascade,product_id uuid,product_name text,image_url text,quantity integer,unit_price numeric,line_total numeric);
      insert into shops values('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','stock-test',true);
      insert into products values('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Carrot scrub',6,true,'',29000),('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Oil',143,true,'',15000);
    `)
    const migration=await readFile(new URL('../supabase/migrations/20261005_orders_notifications_launch.sql',import.meta.url),'utf8')
    const orderFunction=migration.slice(migration.indexOf('create or replace function public.create_public_order('),migration.indexOf('create or replace function public.get_public_order('))
    await db.exec(orderFunction)
    const order=async(scrubQuantity)=>db.query("select create_public_order('stock-test','Test buyer','123456789','Test location','','other','',$1::jsonb) as result",[JSON.stringify([{product_id:'30000000-0000-4000-8000-000000000001',quantity:scrubQuantity},{product_id:'30000000-0000-4000-8000-000000000002',quantity:20}])])
    const result=(await order(6)).rows[0].result
    assert.equal(Number(result.total),474000)
    assert.ok(result.public_ref)
    await assert.rejects(order(7),/Carrot scrub does not have enough stock/)
    assert.equal((await db.query('select count(*)::int as n from orders')).rows[0].n,1)
    assert.equal((await db.query('select count(*)::int as n from order_items')).rows[0].n,2)
  }finally{await db.close()}
})
