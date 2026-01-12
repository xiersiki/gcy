import { NextResponse } from 'next/server'

import { getSupabaseServerClient } from '@/server/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  const origin = new URL(req.url).origin
  return NextResponse.redirect(new URL('/works', origin), { status: 302 })
}
