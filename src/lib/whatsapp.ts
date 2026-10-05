import type { Product } from '../data/mock'
import { siteUrl } from './site'

function money(value:number){
  return new Intl.NumberFormat('en-UG').format(value)
}

export function publicUrl(path:string){
  return siteUrl(path)
}

export function whatsappUrl(phone:string,message:string){
  const digits=phone.replace(/\D/g,'')
  return digits ? 'https://wa.me/'+digits+'?text='+encodeURIComponent(message) : ''
}

export function productWhatsappMessage(product:Product,shopName:string,quantity=1){
  const image=product.images?.[0]||product.image
  const subtotal=product.price*quantity
  const lines=[
    'Hello '+shopName+',',
    '',
    'I found this product on Gulako and I am interested in ordering:',
    '',
    '🛍️ '+product.name,
    '💰 Price: '+product.currency+' '+money(product.price),
    '🔢 Quantity: '+quantity,
    quantity>1 ? '💵 Subtotal: '+product.currency+' '+money(subtotal) : '',
    '🏪 Shop: '+shopName,
    '🔗 Product: '+publicUrl('/product/'+product.id),
    image ? '🖼️ Image: '+image : '',
    '',
    'Please confirm availability, delivery fee and the next step for payment.'
  ]
  return lines.filter(Boolean).join('\n')
}

export function orderWhatsappMessage(
  lines:Array<{product:Product;quantity:number}>,
  shopName:string,
  shopSlug:string,
){
  const total=lines.reduce((sum,line)=>sum+line.product.price*line.quantity,0)
  const details=lines.flatMap((line,index)=>{
    const image=line.product.images?.[0]||line.product.image
    return [
      (index+1)+'. '+line.product.name,
      '   Qty: '+line.quantity+' · '+line.product.currency+' '+money(line.product.price*line.quantity),
      '   Product: '+publicUrl('/product/'+line.product.id),
      image ? '   Image: '+image : '',
    ].filter(Boolean)
  })
  return [
    'Hello '+shopName+',',
    '',
    'I would like to confirm this order from Gulako:',
    '',
    ...details,
    '',
    '💵 Total: UGX '+money(total),
    '🏪 Shop: '+publicUrl('/'+shopSlug),
    '',
    'Please confirm availability, delivery fee and payment details. Thank you.'
  ].join('\n')
}

export function shopWhatsappMessage(shopName:string,shopSlug:string){
  return [
    'Hello '+shopName+',',
    '',
    'I found your shop on Gulako and I would like to ask about your products.',
    '🏪 Shop: '+publicUrl('/'+shopSlug),
    '',
    'Please assist me. Thank you.'
  ].join('\n')
}
