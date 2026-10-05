import { backend } from './backend'

export type OrderStatus='new'|'confirmed'|'processing'|'delivering'|'completed'|'cancelled'
export type PaymentStatus='unverified'|'reported'|'confirmed'

export type OrderItem={
  id:string
  productId:string|null
  productName:string
  imageUrl:string
  quantity:number
  unitPrice:number
  lineTotal:number
}

export type SellerOrder={
  id:string
  publicRef:string
  customerName:string
  customerPhone:string
  deliveryLocation:string
  customerNote:string
  subtotal:number
  total:number
  currency:string
  paymentMethod:'mtn'|'airtel'|'other'
  paymentReference:string
  paymentStatus:PaymentStatus
  status:OrderStatus
  createdAt:string
  updatedAt:string
  items:OrderItem[]
}

export type SellerNotification={
  id:string
  kind:string
  title:string
  body:string
  href:string
  readAt:string|null
  createdAt:string
}

export type PublicOrder={
  publicRef:string
  shopName:string
  shopSlug:string
  status:OrderStatus
  paymentStatus:PaymentStatus
  total:number
  currency:string
  createdAt:string
  updatedAt:string
  items:Array<{name:string;quantity:number;unitPrice:number;lineTotal:number;imageUrl:string}>
}

const mapOrder=(row:any):SellerOrder=>({
  id:row.id,
  publicRef:row.public_ref,
  customerName:row.customer_name??'Customer',
  customerPhone:row.customer_phone??'',
  deliveryLocation:row.delivery_location??'',
  customerNote:row.customer_note??'',
  subtotal:Number(row.subtotal??0),
  total:Number(row.total??0),
  currency:row.currency??'UGX',
  paymentMethod:(row.payment_method??'other') as SellerOrder['paymentMethod'],
  paymentReference:row.payment_reference??'',
  paymentStatus:(row.payment_status??'unverified') as PaymentStatus,
  status:(row.status??'new') as OrderStatus,
  createdAt:row.created_at,
  updatedAt:row.updated_at,
  items:(row.order_items??[]).map((item:any)=>({
    id:item.id,
    productId:item.product_id??null,
    productName:item.product_name,
    imageUrl:item.image_url??'',
    quantity:Number(item.quantity??1),
    unitPrice:Number(item.unit_price??0),
    lineTotal:Number(item.line_total??0),
  })),
})

export function formatOrderStatus(status:OrderStatus){
  const labels:Record<OrderStatus,string>={
    new:'New',confirmed:'Confirmed',processing:'Processing',delivering:'Delivering',completed:'Completed',cancelled:'Cancelled',
  }
  return labels[status]
}

export async function fetchSellerOrders():Promise<SellerOrder[]>{
  const {data,error}=await backend.from('orders')
    .select('*, order_items(*)')
    .order('created_at',{ascending:false})
  if(error)throw error
  return (data??[]).map(mapOrder)
}

export async function updateSellerOrderStatus(id:string,status:OrderStatus){
  const {error}=await backend.from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id)
  if(error)throw error
  window.dispatchEvent(new Event('gulako-orders'))
}

export async function updateOrderPaymentStatus(id:string,status:PaymentStatus){
  const {error}=await backend.from('orders').update({payment_status:status,updated_at:new Date().toISOString()}).eq('id',id)
  if(error)throw error
  window.dispatchEvent(new Event('gulako-orders'))
}

export async function placePublicOrder(input:{
  shopSlug:string
  customerName:string
  customerPhone:string
  deliveryLocation:string
  note:string
  paymentMethod:'mtn'|'airtel'|'other'
  paymentReference:string
  items:Array<{productId:string;quantity:number}>
}){
  const {data,error}=await backend.rpc('create_public_order',{
    shop_slug:input.shopSlug,
    buyer_name:input.customerName,
    buyer_phone:input.customerPhone,
    buyer_location:input.deliveryLocation,
    buyer_note:input.note,
    pay_method:input.paymentMethod,
    pay_reference:input.paymentReference,
    items:input.items.map(item=>({product_id:item.productId,quantity:item.quantity})),
  })
  if(error)throw error
  if(!data?.public_ref)throw new Error('Order could not be created.')
  return{
    id:String(data.id??''),
    publicRef:String(data.public_ref),
    total:Number(data.total??0),
    currency:String(data.currency??'UGX'),
    status:(data.status??'new') as OrderStatus,
  }
}

export async function fetchPublicOrder(ref:string):Promise<PublicOrder|null>{
  const {data,error}=await backend.rpc('get_public_order',{order_ref:ref})
  if(error)throw error
  if(!data)return null
  return{
    publicRef:String(data.public_ref),
    shopName:String(data.shop_name??'Shop'),
    shopSlug:String(data.shop_slug??''),
    status:(data.status??'new') as OrderStatus,
    paymentStatus:(data.payment_status??'unverified') as PaymentStatus,
    total:Number(data.total??0),
    currency:String(data.currency??'UGX'),
    createdAt:String(data.created_at??''),
    updatedAt:String(data.updated_at??''),
    items:Array.isArray(data.items)?data.items.map((item:any)=>({
      name:String(item.name??'Product'),
      quantity:Number(item.quantity??1),
      unitPrice:Number(item.unit_price??0),
      lineTotal:Number(item.line_total??0),
      imageUrl:String(item.image_url??''),
    })):[],
  }
}

export async function fetchSellerNotifications(limit=10):Promise<SellerNotification[]>{
  const {data,error}=await backend.from('notifications')
    .select('id,kind,title,body,href,read_at,created_at')
    .order('created_at',{ascending:false})
    .limit(limit)
  if(error)throw error
  return (data??[]).map((row:any)=>({
    id:row.id,
    kind:row.kind,
    title:row.title,
    body:row.body??'',
    href:row.href||'/dashboard',
    readAt:row.read_at??null,
    createdAt:row.created_at,
  }))
}

export async function markNotificationRead(id:string){
  const {error}=await backend.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id)
  if(error)throw error
}

export async function markAllNotificationsRead(){
  const {error}=await backend.from('notifications').update({read_at:new Date().toISOString()}).is('read_at',null)
  if(error)throw error
}
