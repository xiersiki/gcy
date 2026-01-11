'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { getSupabaseBrowserClient } from '@/server/supabase/browser'
import styles from './AuthButton.module.scss'

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
      <Link href="/login" className={styles.loginBtn}>
        登录 / 注册
      </Link>
    )
  }

  return (
    <div className={styles.userContainer}>
      <span className={styles.userEmail} title={email}>
        {email}
      </span>
      <form action="/auth/logout" method="post">
        <button type="submit" className={styles.logoutBtn}>
          退出
        </button>
      </form>
    </div>
  )
}
