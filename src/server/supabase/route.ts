import { createServerClient } from '@supabase/ssr'
import type { NextResponse } from 'next/server'

import { getSupabaseEnv } from './env'

type ParsedCookie = { name: string; value: string }

function parseCookieHeader(cookieHeader: string): ParsedCookie[] {
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
}

export function createSupabaseRouteClient(req: Request, response: NextResponse) {
  const { url, anonKey } = getSupabaseEnv()
  if (!url || !anonKey) throw new Error('Supabase 未配置')

  const requestCookies = parseCookieHeader(req.headers.get('cookie') || '')
  return createServerClient(url, anonKey, {
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
}
