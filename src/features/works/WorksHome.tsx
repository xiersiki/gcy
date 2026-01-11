'use client'

import { useEffect, useMemo, useState } from 'react'

import type { AuthorProfile, WorkIndexItem } from '@/models/content'

import { IdeaBoardSection } from './IdeaBoardSection'
import { IdeaClaimModal } from './IdeaClaimModal'
import { IdeaCompleteModal } from './IdeaCompleteModal'
import { IdeaDetailsModal } from './IdeaDetailsModal'
import { IdeaPublishModal } from './IdeaPublishModal'
import { WorkCard } from './WorkCard'
import styles from './WorksHome.module.css'

export type WorksHomeProps = {
  authors: Record<string, AuthorProfile>
  works: WorkIndexItem[]
  categories: string[]
}

export function WorksHome({ authors, works, categories }: WorksHomeProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? 'All')
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isClaimOpen, setIsClaimOpen] = useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [communityIdeasRemote, setCommunityIdeasRemote] = useState<WorkIndexItem[]>([])

  const filteredWorks = useMemo(() => {
    const completed = works.filter((w) => w.type !== 'idea' && !w.draft)
    if (activeCategory === 'All') return completed
    return completed.filter((w) => w.category === activeCategory)
  }, [activeCategory, works])

  const boardItems = useMemo(() => {
    return works
      .filter((w) => w.type === 'idea' && !w.draft)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [works])

  useEffect(() => {
    let cancelled = false
    fetch('/api/ideas/community')
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => {
        if (cancelled) return
        const maybe = list as { ok?: unknown; data?: unknown } | null
        const data = maybe && maybe.ok === true ? maybe.data : null
        setCommunityIdeasRemote(Array.isArray(data) ? (data as WorkIndexItem[]) : [])
      })
      .catch(() => {
        if (cancelled) return
        setCommunityIdeasRemote([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const communityIdeas = useMemo(() => {
    const byId = new Map<string, WorkIndexItem>()
    for (const it of communityIdeasRemote) byId.set(it.id, it)
    for (const it of boardItems) byId.set(it.id, it)
    return Array.from(byId.values()).sort((a, b) => b.date.localeCompare(a.date))
  }, [boardItems, communityIdeasRemote])

  const selectedIdea = useMemo(() => {
    if (!selectedIdeaId) return null
    return communityIdeas.find((w) => w.id === selectedIdeaId) ?? null
  }, [communityIdeas, selectedIdeaId])

  return (
    <main>
      <section className={styles.hero}>
        <h1 className={styles.title}>Selected Works Collection</h1>
        <p className={styles.subtitle}>
          我们把一些有意思的前端点子、实验和实现记录在这里，作为长期可维护的展示与索引。
        </p>
      </section>

      <section className={styles.filterBar}>
        <div className={styles.filters}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`${styles.chip} ${activeCategory === cat ? styles.chipActive : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {filteredWorks.length ? (
        <div className="grid">
          {filteredWorks.map((w) => (
            <WorkCard key={w.id} work={w} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <h3>这个分类下还没有已完成作品</h3>
          <button type="button" onClick={() => setActiveCategory('All')}>
            回到全部作品
          </button>
        </div>
      )}

      <IdeaBoardSection
        authors={authors}
        ideas={communityIdeas}
        onSelectIdea={(id) => setSelectedIdeaId(id)}
        onOpenPublish={() => setIsCreateOpen(true)}
      />

      <IdeaDetailsModal
        authors={authors}
        idea={selectedIdea}
        onClose={() => setSelectedIdeaId(null)}
        onOpenClaim={() => setIsClaimOpen(true)}
        onOpenComplete={() => setIsCompleteOpen(true)}
      />
      <IdeaClaimModal
        open={isClaimOpen}
        idea={selectedIdea}
        authors={authors}
        onClose={() => setIsClaimOpen(false)}
      />
      <IdeaCompleteModal
        open={isCompleteOpen}
        idea={selectedIdea}
        authors={authors}
        onClose={() => setIsCompleteOpen(false)}
      />
      <IdeaPublishModal
        authors={authors}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPublished={(idea: WorkIndexItem) => {
          setCommunityIdeasRemote((prev) => {
            const next = [idea, ...prev.filter((it) => it.id !== idea.id)]
            next.sort((a, b) => b.date.localeCompare(a.date))
            return next
          })
          setSelectedIdeaId(idea.id)
        }}
      />
    </main>
  )
}
