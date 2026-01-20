'use client'

import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'

import type { WorkIndexItem } from '@/models/content'
import { BgDecor } from '@/components/shared/BgDecor'
import { WorkCard } from './WorkCard'
import layoutStyles from '@/components/shared/LayoutShell.module.scss'
import styles from '@/components/shared/CollectionSection.module.scss'

export type WorksPageContentProps = {
  works: WorkIndexItem[]
  categories: string[]
}

export function WorksPageContent({ works, categories }: WorksPageContentProps) {
  const [activeCategory, setActiveCategory] = useState('All')

  const filteredWorks = useMemo(() => {
    const completed = works.filter((w) => w.type !== 'idea' && !w.draft)
    if (activeCategory === 'All') return completed
    return completed.filter((w) => w.category === activeCategory)
  }, [activeCategory, works])

  return (
    <div className={layoutStyles.container}>
      <BgDecor />
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Featured Works</h2>
            <p className={styles.sectionSubtitle}>
              Hand-picked components from our creative community.
            </p>
          </div>
        </div>

        <div className={styles.filterBar}>
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
        </div>

        {filteredWorks.length ? (
          <div className={styles.grid}>
            {filteredWorks.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <h3>No works found in this category</h3>
            <p>Try adjusting your filters or search terms.</p>
            <button type="button" onClick={() => setActiveCategory('All')}>
              Back to all works
            </button>
          </div>
        )}
      </motion.section>
    </div>
  )
}
