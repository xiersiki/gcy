export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

import { getSupabaseEnv } from '@/server/supabase/env'
import { createSupabaseRouteClient } from '@/server/supabase/route'

export async function POST(req: Request) {
  const origin = new URL(req.url).origin
  const { url, anonKey } = getSupabaseEnv()
  if (!url || !anonKey) return NextResponse.redirect(new URL('/works', origin), { status: 302 })
  const response = NextResponse.redirect(new URL('/works', origin), { status: 302 })
  const supabase = createSupabaseRouteClient(req, response)

  await supabase.auth.signOut()
  return response
}
