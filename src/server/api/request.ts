export function getRequestId(req: Request) {
  const fromHeader = req.headers.get('x-request-id')
  if (fromHeader) return fromHeader
  try {
    return crypto.randomUUID()
  } catch {
    return String(Date.now())
  }
}
