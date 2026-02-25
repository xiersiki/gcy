import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WorkComments } from '@/features/works/WorkComments'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/works/gcy/demo2',
}))

vi.mock('@/features/works/hooks/useWorkStats', () => ({
  mutateWorkStats: vi.fn(),
  revalidateWorkStats: vi.fn(async () => {}),
}))

function ok<T>(data: T) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function err(code: string, status: number) {
  return new Response(JSON.stringify({ ok: false, error: { code, message: code } }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('WorkComments', () => {
  beforeEach(() => {
    pushMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('redirects to login when submit returns 401 and rolls back optimistic item', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'
      if (url.includes('/comments') && method === 'GET') {
        return Promise.resolve(ok({ items: [], nextCursor: null }))
      }
      if (url.includes('/comments') && method === 'POST') {
        return Promise.resolve(err('UNAUTHORIZED', 401))
      }
      return Promise.resolve(ok({}))
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<WorkComments authorId="gcy" slug="demo2" />)

    await waitFor(() => expect(screen.queryByText('加载中…')).not.toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText('写下你的评论…（需要登录）'), {
      target: { value: 'hello' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发送' }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/login?next=%2Fworks%2Fgcy%2Fdemo2')
    })
    expect(screen.queryByText('hello', { selector: 'div' })).not.toBeInTheDocument()
  })

  it('can recover from initial load failure by retrying', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (!url.includes('/comments')) return Promise.resolve(ok({}))
      const calls = fetchMock.mock.calls.filter(([u]) => String(u).includes('/comments')).length
      if (calls === 1) {
        return Promise.resolve(err('SUPABASE_ERROR', 500))
      }
      return Promise.resolve(
        ok({
          items: [
            {
              id: 'c1',
              workId: 'gcy/demo2',
              userId: 'u1',
              body: 'retry success',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              profile: null,
            },
          ],
          nextCursor: null,
        }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<WorkComments authorId="gcy" slug="demo2" />)

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '重试' }))
    await waitFor(() => expect(screen.getByText('retry success')).toBeInTheDocument())
  })
})
