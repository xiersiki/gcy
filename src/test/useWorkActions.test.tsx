import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useWorkActions } from '@/features/works/hooks/useWorkActions'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/works/gcy/demo2',
}))

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function defer<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useWorkActions', () => {
  beforeEach(() => {
    pushMock.mockReset()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('redirects to login when user is unauthenticated', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.endsWith('/me')) {
          return jsonResponse({ ok: false, error: { code: 'UNAUTHORIZED', message: 'auth' } }, 401)
        }
        return jsonResponse({ ok: true, data: {} })
      }),
    )

    const { result } = renderHook(() => useWorkActions('gcy', 'demo2'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.toggleLike()
    })

    expect(pushMock).toHaveBeenCalledWith('/login?next=%2Fworks%2Fgcy%2Fdemo2')
  })

  it('prevents duplicate like requests while one request is in flight', async () => {
    const pendingLike = defer<Response>()
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'
      if (url.endsWith('/me')) {
        return Promise.resolve(
          jsonResponse({ ok: true, data: { liked: false, bookmarked: false } }),
        )
      }
      if (url.endsWith('/like') && method === 'POST') {
        return pendingLike.promise
      }
      return Promise.resolve(
        jsonResponse({ ok: true, data: { likeCount: 0, bookmarkCount: 0, commentCount: 0 } }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useWorkActions('gcy', 'demo2'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      void result.current.toggleLike()
      void result.current.toggleLike()
    })

    const likeCalls = fetchMock.mock.calls.filter(([input, init]) => {
      return String(input).endsWith('/like') && (init?.method || 'GET') === 'POST'
    })
    expect(likeCalls).toHaveLength(1)

    pendingLike.resolve(jsonResponse({ ok: true, data: { liked: true } }))
    await waitFor(() => expect(result.current.liking).toBe(false))
  })
})
