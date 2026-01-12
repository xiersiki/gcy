import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { getSupabaseEnv } from '@/server/supabase/env'

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

  const cookieHeader = req.headers.get('cookie') || ''
  const requestCookies = cookieHeader
    ? cookieHeader
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((part) => {
          const idx = part.indexOf('=')
          const name = idx >= 0 ? part.slice(0, idx) : part
          const value = idx >= 0 ? decodeURIComponent(part.slice(idx + 1)) : ''
          return { name, value }
        })
    : []

  const response = NextResponse.redirect(new URL('/login', origin), { status: 302 })
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return requestCookies
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

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
