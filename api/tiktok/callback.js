import { createClient } from '@supabase/supabase-js'

const SITE='https://gulako.site'
const REDIRECT_URI=SITE+'/api/tiktok/callback'

function readCookie(header,name){
  if(!header)return''
  const part=header.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))
  return part?decodeURIComponent(part.slice(name.length+1)):''
}

function fail(res,reason){
  res.redirect(302,SITE+'/signin?tiktok_error='+encodeURIComponent(reason))
}

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.status(405).json({error:'Method not allowed'})
    return
  }

  const clientKey=process.env.TIKTOK_CLIENT_KEY
  const clientSecret=process.env.TIKTOK_CLIENT_SECRET
  const supabaseUrl=process.env.VITE_API_URL||process.env.VITE_SUPABASE_URL
  const serviceRole=process.env.SUPABASE_SERVICE_ROLE_KEY

  if(!clientKey||!clientSecret||!supabaseUrl||!serviceRole){
    fail(res,'setup')
    return
  }

  const code=typeof req.query.code==='string'?req.query.code:''
  const returnedState=typeof req.query.state==='string'?req.query.state:''
  const error=typeof req.query.error==='string'?req.query.error:''
  const cookieState=readCookie(req.headers.cookie,'gulako_tiktok_state')

  if(error){fail(res,'denied');return}
  if(!code||!returnedState||!cookieState||returnedState!==cookieState){
    fail(res,'state')
    return
  }

  res.setHeader('Set-Cookie','gulako_tiktok_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax')

  try{
    const tokenBody=new URLSearchParams({
      client_key:clientKey,
      client_secret:clientSecret,
      code,
      grant_type:'authorization_code',
      redirect_uri:REDIRECT_URI,
    })

    const tokenResponse=await fetch('https://open.tiktokapis.com/v2/oauth/token/',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:tokenBody,
    })
    const token=await tokenResponse.json()
    if(!tokenResponse.ok||!token.access_token||!token.open_id){
      fail(res,'token')
      return
    }

    const userResponse=await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',{
      headers:{Authorization:'Bearer '+token.access_token},
    })
    const userJson=await userResponse.json()
    const profile=userJson?.data?.user
    if(!userResponse.ok||!profile?.open_id){
      fail(res,'profile')
      return
    }

    const admin=createClient(supabaseUrl,serviceRole,{
      auth:{autoRefreshToken:false,persistSession:false},
    })

    const {data:identity}=await admin
      .from('social_identities')
      .select('user_id')
      .eq('provider','tiktok')
      .eq('provider_user_id',profile.open_id)
      .maybeSingle()

    let userId=identity?.user_id||''
    let email=''

    if(userId){
      const {data:userData}=await admin.auth.admin.getUserById(userId)
      email=userData.user?.email||''
      await admin.from('social_identities').update({
        display_name:profile.display_name||'',
        avatar_url:profile.avatar_url||'',
        updated_at:new Date().toISOString(),
      }).eq('provider','tiktok').eq('provider_user_id',profile.open_id)
    }else{
      email='tiktok_'+String(profile.open_id).replace(/[^a-zA-Z0-9_-]/g,'')+'@auth.gulako.site'
      const {data:created,error:createError}=await admin.auth.admin.createUser({
        email,
        email_confirm:true,
        user_metadata:{
          full_name:profile.display_name||'TikTok user',
          avatar_url:profile.avatar_url||'',
          auth_provider:'tiktok',
          tiktok_open_id:profile.open_id,
        },
      })

      if(createError||!created.user){
        const {data:list}=await admin.auth.admin.listUsers({page:1,perPage:1000})
        const existing=list.users.find(user=>user.email===email)
        if(!existing){fail(res,'account');return}
        userId=existing.id
      }else{
        userId=created.user.id
      }

      const {error:identityError}=await admin.from('social_identities').upsert({
        provider:'tiktok',
        provider_user_id:profile.open_id,
        user_id:userId,
        display_name:profile.display_name||'',
        avatar_url:profile.avatar_url||'',
        updated_at:new Date().toISOString(),
      },{onConflict:'provider,provider_user_id'})
      if(identityError){fail(res,'identity');return}
    }

    if(!email){
      const {data:userData}=await admin.auth.admin.getUserById(userId)
      email=userData.user?.email||''
    }
    if(!email){fail(res,'account');return}

    const {data:link,error:linkError}=await admin.auth.admin.generateLink({
      type:'magiclink',
      email,
      options:{redirectTo:SITE+'/auth/callback'},
    })
    const tokenHash=link?.properties?.hashed_token
    if(linkError||!tokenHash){fail(res,'session');return}

    const target=new URL(SITE+'/auth/callback')
    target.searchParams.set('token_hash',tokenHash)
    target.searchParams.set('type','magiclink')
    target.searchParams.set('provider','tiktok')
    res.redirect(302,target.toString())
  }catch{
    fail(res,'unexpected')
  }
}
