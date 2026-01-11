import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { getSupabaseEnv } from '@/server/supabase/env'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { url, anonKey } = getSupabaseEnv()
  if (!url || !anonKey) return new Response('Missing Supabase env', { status: 500 })

  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  if (!code) return new Response('Missing code', { status: 400 })

  const response = NextResponse.redirect(new URL('/works', requestUrl.origin))

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

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return new Response(error.message, { status: 500 })

  return response
}
