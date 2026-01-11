type Bucket = {
  tokens: number
  updatedAt: number
}

const buckets = new Map<string, Bucket>()

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = buckets.get(key) ?? { tokens: limit, updatedAt: now }
  const elapsed = now - bucket.updatedAt
  if (elapsed > 0) {
    const refill = (elapsed / windowMs) * limit
    bucket.tokens = Math.min(limit, bucket.tokens + refill)
    bucket.updatedAt = now
  }
  if (bucket.tokens < 1) {
    buckets.set(key, bucket)
    return { ok: false as const }
  }
  bucket.tokens -= 1
  buckets.set(key, bucket)
  return { ok: true as const }
}
