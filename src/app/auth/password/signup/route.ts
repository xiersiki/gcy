import { NextResponse } from 'next/server'

import { getSupabaseEnv, isLikelyJwtKey } from '@/server/supabase/env'
import { createSupabaseRouteClient } from '@/server/supabase/route'

export const runtime = 'edge'
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
  if (!isLikelyJwtKey(anonKey)) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent('Supabase Key 配置错误：请使用 Dashboard 的 anon public key（JWT）')}`,
        origin,
      ),
      { status: 302 },
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
  if (password.length < 6) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('密码至少 6 位')}`, origin),
      { status: 302 },
    )
  }

  const response = NextResponse.redirect(new URL('/works', origin), { status: 302 })
  const supabase = createSupabaseRouteClient(req, response)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })
  if (error) {
    const hint =
      error.message === 'User already registered'
        ? '用户已存在：如果忘记密码，请使用“找回密码”重置后登录'
        : error.message
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(hint)}`, origin), {
      status: 302,
    })
  }

  if (!data.session) {
    return NextResponse.redirect(
      new URL(
        '/login?success=' + encodeURIComponent('注册成功：请检查邮箱完成验证后再登录'),
        origin,
      ),
      { status: 302 },
    )
  }

  return response
}
