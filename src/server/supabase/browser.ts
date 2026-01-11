import { createBrowserClient } from '@supabase/ssr'

import { getSupabaseEnv } from './env'

export function getSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv()
  if (!url || !anonKey) return null
  return createBrowserClient(url, anonKey)
}
