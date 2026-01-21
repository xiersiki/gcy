'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { IdeaIndexItem } from '@/models/idea'
import { readApiData } from '@/shared/api'

function sortByDateDesc(list: IdeaIndexItem[]) {
  const next = [...list]
  next.sort((a, b) => b.date.localeCompare(a.date))
  return next
}

export function useCommunityIdeas(initialIdeas?: IdeaIndexItem[]) {
  const [remoteIdeas, setRemoteIdeas] = useState<IdeaIndexItem[]>(() => initialIdeas ?? [])
  const [error, setError] = useState<string>('')

  const refresh = useCallback(() => {
    let cancelled = false
    fetch('/api/ideas/community')
      .then((r) => readApiData<IdeaIndexItem[]>(r))
      .then((list) => {
        if (cancelled) return
        setRemoteIdeas(Array.isArray(list) ? list : [])
        setError('')
      })
      .catch(() => {
        if (cancelled) return
        setError('刷新失败：请稍后重试')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const cancel = refresh()
    return cancel
  }, [refresh])

  const ideas = useMemo(() => sortByDateDesc(remoteIdeas), [remoteIdeas])

  const upsertIdea = useCallback((idea: IdeaIndexItem) => {
    setRemoteIdeas((prev) => {
      const next = [idea, ...prev.filter((it) => it.id !== idea.id)]
      return sortByDateDesc(next)
    })
  }, [])

  return { ideas, refresh, upsertIdea, error }
}
