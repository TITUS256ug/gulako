import crypto from 'node:crypto'

const REDIRECT_URI='https://gulako.site/api/tiktok/callback'

function makeState(secret){
  const nonce=crypto.randomBytes(20).toString('hex')
  const ts=String(Date.now())
  const payload=nonce+'.'+ts
  const sig=crypto.createHmac('sha256',secret).update(payload).digest('hex')
  return payload+'.'+sig
}

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.status(405).json({error:'Method not allowed'})
    return
  }

  const clientKey=(process.env.TIKTOK_CLIENT_KEY||'').trim()
  const clientSecret=(process.env.TIKTOK_CLIENT_SECRET||'').trim()
  if(!clientKey||!clientSecret){
    res.redirect(302,'https://gulako.site/signin?tiktok_error=setup')
    return
  }

  const state=makeState(clientSecret)

  const url=new URL('https://www.tiktok.com/v2/auth/authorize/')
  url.searchParams.set('client_key',clientKey)
  url.searchParams.set('scope','user.info.basic')
  url.searchParams.set('response_type','code')
  url.searchParams.set('redirect_uri',REDIRECT_URI)
  url.searchParams.set('state',state)

  res.redirect(302,url.toString())
}
