import crypto from 'node:crypto'

const REDIRECT_URI='https://gulako.site/api/tiktok/callback'

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.status(405).json({error:'Method not allowed'})
    return
  }

  const clientKey=process.env.TIKTOK_CLIENT_KEY
  if(!clientKey){
    res.redirect(302,'https://gulako.site/signin?tiktok_error=setup')
    return
  }

  const state=crypto.randomBytes(24).toString('hex')
  res.setHeader('Set-Cookie',`gulako_tiktok_state=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`)

  const url=new URL('https://www.tiktok.com/v2/auth/authorize/')
  url.searchParams.set('client_key',clientKey)
  url.searchParams.set('scope','user.info.basic')
  url.searchParams.set('response_type','code')
  url.searchParams.set('redirect_uri',REDIRECT_URI)
  url.searchParams.set('state',state)

  res.redirect(302,url.toString())
}
