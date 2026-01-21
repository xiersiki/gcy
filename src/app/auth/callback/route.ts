import { NextResponse } from 'next/server'

import { getSupabaseEnv } from '@/server/supabase/env'
import { createSupabaseRouteClient } from '@/server/supabase/route'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { url, anonKey } = getSupabaseEnv()
  if (!url || !anonKey) return new Response('Missing Supabase env', { status: 500 })

  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  if (!code) return new Response('Missing code', { status: 400 })

  const next = requestUrl.searchParams.get('next')
  const safeNext = next && next.startsWith('/') ? next : '/works'
  const response = NextResponse.redirect(new URL(safeNext, requestUrl.origin))
  const supabase = createSupabaseRouteClient(req, response)

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return new Response(error.message, { status: 500 })

  return response
}
