'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { getSupabaseBrowserClient } from '@/server/supabase/browser'

export function AuthButton() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setEmail(data.user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setEmail(session?.user?.email ?? null)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (!email) {
    return (
      <Link href="/login" style={{ fontWeight: 900 }}>
        登录
      </Link>
    )
  }

  return (
    <form action="/auth/logout" method="post" style={{ display: 'inline-flex', gap: 10 }}>
      <span style={{ color: '#6b7280', fontSize: 12, maxWidth: 180, overflow: 'hidden' }}>
        {email}
      </span>
      <button
        type="submit"
        style={{ fontWeight: 900, background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        退出
      </button>
    </form>
  )
}
