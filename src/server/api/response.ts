export type ApiOk<T> = {
  ok: true
  data: T
}

export type ApiError = {
  ok: false
  error: {
    code: string
    message: string
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return new Response(JSON.stringify({ ok: true, data } satisfies ApiOk<T>), {
    status: init?.status ?? 200,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
  })
}

export function jsonError(code: string, message: string, status = 400, init?: ResponseInit) {
  return new Response(
    JSON.stringify({
      ok: false,
      error: { code, message },
    } satisfies ApiError),
    {
      status,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers || {}),
      },
    },
  )
}
