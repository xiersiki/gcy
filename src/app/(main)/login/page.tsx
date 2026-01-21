import { redirect } from 'next/navigation'

import { getSupabaseServerClient } from '@/server/supabase/server'
import { getSupabaseEnv, isLikelyJwtKey } from '@/server/supabase/env'
import { LoginClient } from './LoginClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string; reset?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const originalError = sp.error ? decodeURIComponent(sp.error) : ''
  const success = sp.success ? decodeURIComponent(sp.success) : ''
  const reset = sp.reset === '1'

  let error = originalError
  try {
    const { url, anonKey } = getSupabaseEnv()
    if (!url || !anonKey) {
      error ||= 'Supabase 未配置'
    } else if (!isLikelyJwtKey(anonKey)) {
      error ||= 'Supabase Key 配置错误：请使用 Dashboard 的 anon public key（JWT）'
    } else {
      const supabase = await getSupabaseServerClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) redirect('/works')
    }
  } catch (e) {
    error ||= e instanceof Error ? e.message : '登录初始化失败'
  }

  return (
    <main>
      <LoginClient initialError={error} initialSuccess={success} resetMode={reset} />
    </main>
  )
}
