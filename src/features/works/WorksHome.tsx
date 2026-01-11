'use client'

import { useMemo, useState } from 'react'

import type { WorkIndexItem } from '@/content/types'

import { WorkCard } from './WorkCard'
import styles from './WorksHome.module.css'

export type WorksHomeProps = {
  works: WorkIndexItem[]
  categories: string[]
}

export function WorksHome({ works, categories }: WorksHomeProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? 'All')

  const filteredWorks = useMemo(() => {
    if (activeCategory === 'All') return works
    return works.filter((w) => w.category === activeCategory)
  }, [activeCategory, works])

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
          <h3>No projects found in this category</h3>
          <button type="button" onClick={() => setActiveCategory('All')}>
            Back to All Works
          </button>
        </div>
      )}
    </main>
  )
}
