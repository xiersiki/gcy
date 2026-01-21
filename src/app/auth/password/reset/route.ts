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
  const email = String(form.get('email') || '').trim()
  if (!email) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('请填写邮箱')}`, origin),
      { status: 302 },
    )
  }

  const response = NextResponse.redirect(
    new URL('/login?success=' + encodeURIComponent('已发送重置邮件：请到邮箱完成重置'), origin),
    { status: 302 },
  )
  const supabase = createSupabaseRouteClient(req, response)

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/login?reset=1')}`,
  })
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin),
      { status: 302 },
    )
  }

  return response
}
