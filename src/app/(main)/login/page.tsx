import { redirect } from 'next/navigation'

import { getSupabaseServerClient } from '@/server/supabase/server'
import { LoginClient } from './LoginClient'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>
}) {
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (data.user) redirect('/works')

  const sp = (await searchParams) ?? {}
  const error = sp.error ? decodeURIComponent(sp.error) : ''
  const success = sp.success ? decodeURIComponent(sp.success) : ''

  return (
    <main>
      <LoginClient initialError={error} initialSuccess={success} />
    </main>
  )
}
