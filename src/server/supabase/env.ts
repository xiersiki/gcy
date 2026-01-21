export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return { url, anonKey, serviceRoleKey }
}

export function isLikelyJwtKey(value: string) {
  const raw = String(value || '')
  if (!raw) return false
  if (raw.startsWith('eyJ') && raw.split('.').length >= 3) return true
  return false
}
