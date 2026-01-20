import { NextResponse } from 'next/server'

import { getSupabaseEnv } from '@/server/supabase/env'
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

  const response = NextResponse.redirect(new URL('/works', origin), { status: 302 })
  const supabase = createSupabaseRouteClient(req, response)

  const { error } = await supabase.auth.signInWithPassword({ email, password })
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
