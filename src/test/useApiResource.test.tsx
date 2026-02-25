import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useApiResource } from '@/shared/useApiResource'

function defer<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useApiResource', () => {
  it('keeps only latest request result (last-write-wins)', async () => {
    const first = defer<number>()
    const second = defer<number>()
    const loader = vi.fn(({ signal }: { signal: AbortSignal }) => {
      if (loader.mock.calls.length === 1) {
        signal.addEventListener('abort', () =>
          first.reject(new DOMException('aborted', 'AbortError')),
        )
        return first.promise
      }
      return second.promise
    })

    const { result } = renderHook(() => useApiResource('key', loader, { immediate: false }))

    await act(async () => {
      void result.current.reload()
      void result.current.reload()
    })

    second.resolve(2)
    await waitFor(() => expect(result.current.data).toBe(2))
  })
})
