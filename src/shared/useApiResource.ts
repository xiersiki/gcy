'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { emptyAsyncResourceState, type AsyncResourceState } from './async'

export type ApiResourceLoader<T> = (ctx: { signal: AbortSignal }) => Promise<T>

export type ApiResourceOptions = {
  immediate?: boolean
}

export function useApiResource<T>(
  key: string,
  loader: ApiResourceLoader<T>,
  options: ApiResourceOptions = {},
) {
  const { immediate = true } = options
  const [state, setState] = useState<AsyncResourceState<T>>(() => emptyAsyncResourceState<T>())
  const requestCounterRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  }, [loader])

  const run = useCallback(async () => {
    requestCounterRef.current += 1
    const requestId = requestCounterRef.current
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState((prev) => ({
      ...prev,
      data: null,
      loading: true,
      error: '',
      requestId,
    }))

    try {
      const data = await loaderRef.current({ signal: controller.signal })
      setState((prev) => {
        if (prev.requestId !== requestId) return prev
        return {
          data,
          loading: false,
          error: '',
          requestId,
        }
      })
      return { ok: true as const, data }
    } catch (error) {
      if (controller.signal.aborted) return { ok: false as const, aborted: true as const }
      setState((prev) => {
        if (prev.requestId !== requestId) return prev
        return {
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Request failed',
        }
      })
      return { ok: false as const, aborted: false as const }
    }
  }, [])

  useEffect(() => {
    requestCounterRef.current += 1
    abortRef.current?.abort()
    if (immediate) {
      void run()
    }
    return () => {
      abortRef.current?.abort()
    }
  }, [immediate, key, run])

  return {
    ...state,
    reload: run,
    setData: (updater: (prev: T | null) => T | null) => {
      setState((prev) => ({
        ...prev,
        data: updater(prev.data),
      }))
    },
  }
}
