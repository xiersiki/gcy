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
      { status: 302 },
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
  const password = String(form.get('password') || '')
  const password2 = String(form.get('password2') || '')
  if (!password || !password2) {
    return NextResponse.redirect(
      new URL(`/login?reset=1&error=${encodeURIComponent('请填写两次新密码')}`, origin),
      { status: 302 },
    )
  }
  if (password.length < 6) {
    return NextResponse.redirect(
      new URL(`/login?reset=1&error=${encodeURIComponent('密码至少 6 位')}`, origin),
      { status: 302 },
    )
  }
  if (password !== password2) {
    return NextResponse.redirect(
      new URL(`/login?reset=1&error=${encodeURIComponent('两次密码不一致')}`, origin),
      { status: 302 },
    )
  }

  const response = NextResponse.redirect(new URL('/works', origin), { status: 302 })
  const supabase = createSupabaseRouteClient(req, response)

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('重置链接已失效：请重新发起找回密码')}`, origin),
      { status: 302 },
    )
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?reset=1&error=${encodeURIComponent(error.message)}`, origin),
      { status: 302 },
    )
  }

  return response
}
