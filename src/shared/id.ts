export function ensureSafeId(value: string, fieldName = 'id') {
  const s = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
  if (!s) throw new Error(`无效的 ${fieldName}`)
  return s
}
