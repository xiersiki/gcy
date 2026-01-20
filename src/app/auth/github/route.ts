import { NextResponse } from 'next/server'

import { getSupabaseEnv } from '@/server/supabase/env'
import { createSupabaseRouteClient } from '@/server/supabase/route'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const origin = new URL(req.url).origin
  const { url: supabaseUrl, anonKey } = getSupabaseEnv()
  if (!supabaseUrl || !anonKey) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Supabase 未配置')}`, origin),
      {
        status: 302,
      },
    )
  }

  const response = NextResponse.redirect(new URL('/login', origin), { status: 302 })
  const supabase = createSupabaseRouteClient(req, response)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })
  if (error) {
    const message =
      error.message.includes('provider is not enabled') ||
      error.message.includes('Unsupported provider')
        ? 'GitHub 登录未启用：请在 Supabase 控制台开启 GitHub Provider'
        : error.message
    response.headers.set(
      'location',
      new URL(`/login?error=${encodeURIComponent(message)}`, origin).toString(),
    )
    return response
  }
  const oauthUrl = data.url
  if (!oauthUrl) {
    response.headers.set(
      'location',
      new URL(`/login?error=${encodeURIComponent('GitHub 登录跳转地址缺失')}`, origin).toString(),
    )
    return response
  }
  response.headers.set('location', oauthUrl)
  return response
}
