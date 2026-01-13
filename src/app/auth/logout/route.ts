export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { getSupabaseEnv } from '@/server/supabase/env'

export async function POST(req: Request) {
  const origin = new URL(req.url).origin
  const { url, anonKey } = getSupabaseEnv()
  if (!url || !anonKey) return NextResponse.redirect(new URL('/works', origin), { status: 302 })

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

  const response = NextResponse.redirect(new URL('/works', origin), { status: 302 })
  const supabase = createServerClient(url, anonKey, {
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

  await supabase.auth.signOut()
  return response
}
