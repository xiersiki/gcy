import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { getSupabaseEnv } from '@/server/supabase/env'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const origin = new URL(req.url).origin
  const { url, anonKey } = getSupabaseEnv()
  if (!url || !anonKey) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Supabase 未配置')}`, origin),
      {
        status: 302,
      },
    )
  }

  const form = await req.formData()
  const email = String(form.get('email') || '').trim()
  const password = String(form.get('password') || '')
  if (!email || !password) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('请填写邮箱和密码')}`, origin),
      {
        status: 302,
      },
    )
  }

  const response = NextResponse.redirect(
    new URL('/login?success=' + encodeURIComponent('注册成功：请检查邮箱完成验证后再登录'), origin),
    { status: 302 },
  )
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        const cookieHeader = req.headers.get('cookie') || ''
        if (!cookieHeader) return []
        return cookieHeader
          .split(';')
          .map((p) => p.trim())
          .filter(Boolean)
          .map((part) => {
            const idx = part.indexOf('=')
            const name = idx >= 0 ? part.slice(0, idx) : part
            const value = idx >= 0 ? decodeURIComponent(part.slice(idx + 1)) : ''
            return { name, value }
          })
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin),
      {
        status: 302,
      },
    )
  }

  return response
}
