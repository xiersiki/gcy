'use client'

import { useMemo, useState } from 'react'

import type { AuthorProfile, WorkIndexItem } from '@/content/types'

import { IdeaBoardSection } from './IdeaBoardSection'
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

  const filteredWorks = useMemo(() => {
    if (activeCategory === 'All') return works
    return works.filter((w) => w.category === activeCategory)
  }, [activeCategory, works])

  const boardItems = useMemo(() => {
    return works
      .filter((w) => w.type === 'idea' && !w.draft)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [works])

  const selectedIdea = useMemo(() => {
    if (!selectedIdeaId) return null
    return boardItems.find((w) => w.id === selectedIdeaId) ?? null
  }, [boardItems, selectedIdeaId])

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
        <>
          <div className="grid">
            {filteredWorks.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>

          <IdeaBoardSection
            authors={authors}
            ideas={boardItems}
            onSelectIdea={(id) => setSelectedIdeaId(id)}
            onOpenPublish={() => setIsCreateOpen(true)}
          />
        </>
      ) : (
        <div className={styles.empty}>
          <h3>No projects found in this category</h3>
          <button type="button" onClick={() => setActiveCategory('All')}>
            Back to All Works
          </button>
        </div>
      )}

      <IdeaDetailsModal
        authors={authors}
        idea={selectedIdea}
        onClose={() => setSelectedIdeaId(null)}
      />
      <IdeaPublishModal
        authors={authors}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </main>
  )
}
