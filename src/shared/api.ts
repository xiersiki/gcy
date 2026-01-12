export type ApiError = {
  code: string
  message: string
}

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiError }

export async function readApiData<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    throw new Error(raw || `Request failed (${res.status})`)
  }
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null
  if (!json) throw new Error('Invalid response')
  if (json.ok !== true) throw new Error(json.error?.message || 'Request failed')
  return json.data
}
