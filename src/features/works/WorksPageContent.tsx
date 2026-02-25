'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { WorkFilterState, WorkIndexItem } from '@/models/content'
import { BgDecor } from '@/components/shared/BgDecor'
import { WorkCard } from './WorkCard'
import layoutStyles from '@/components/shared/LayoutShell.module.scss'
import styles from '@/components/shared/CollectionSection.module.scss'

export type WorksPageContentProps = {
  works: WorkIndexItem[]
  categories: string[]
}

export function normalizeCategoryOptions(categories: string[]): string[] {
  const set = new Set(['All', ...categories])
  return Array.from(set)
}

export function parseWorkFilterStateFromSearchParams(
  searchParams: URLSearchParams,
  categoryOptions: string[],
): WorkFilterState {
  const categoryRaw = searchParams.get('category')
  const featuredRaw = searchParams.get('featured')
  const difficultyRaw = searchParams.get('difficulty')
  const difficulty = ['beginner', 'intermediate', 'advanced'].includes(difficultyRaw || '')
    ? (difficultyRaw as WorkFilterState['difficulty'])
    : 'all'
  const category = categoryRaw && categoryOptions.includes(categoryRaw) ? categoryRaw : 'All'
  return {
    category,
    featured: featuredRaw === '1' || featuredRaw === 'true',
    difficulty,
  }
}

export function toWorkFilterSearchParams(state: WorkFilterState): URLSearchParams {
  const next = new URLSearchParams()
  if (state.category !== 'All') next.set('category', state.category)
  if (state.featured) next.set('featured', '1')
  if (state.difficulty !== 'all') next.set('difficulty', state.difficulty)
  return next
}

export function WorksPageContent({ works, categories }: WorksPageContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const categoryOptions = useMemo(() => normalizeCategoryOptions(categories), [categories])
  const filterState = useMemo(
    () =>
      parseWorkFilterStateFromSearchParams(
        new URLSearchParams(searchParams?.toString() ?? ''),
        categoryOptions,
      ),
    [categoryOptions, searchParams],
  )

  const updateFilter = (next: WorkFilterState) => {
    const nextParams = toWorkFilterSearchParams(next)
    const query = nextParams.toString()
    router.replace(query ? `${pathname ?? ''}?${query}` : (pathname ?? ''), { scroll: false })
  }

  const filteredWorks = useMemo(() => {
    let next = works.filter((w) => w.type !== 'idea' && !w.draft)
    if (filterState.category !== 'All') {
      next = next.filter((w) => w.category === filterState.category)
    }
    if (filterState.featured) {
      next = next.filter((w) => Boolean(w.featured))
    }
    if (filterState.difficulty !== 'all') {
      next = next.filter((w) => w.difficulty === filterState.difficulty)
    }
    return next
  }, [filterState.category, filterState.difficulty, filterState.featured, works])

  return (
    <div className={layoutStyles.container}>
      <BgDecor />
      <section>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>作品列表</h2>
            <p className={styles.sectionSubtitle}>
              按分类、精选和难度快速筛选，查看可复用的交互实现与工程实践。
            </p>
          </div>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.filters}>
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => updateFilter({ ...filterState, category: cat })}
                aria-pressed={filterState.category === cat}
                className={`${styles.chip} ${filterState.category === cat ? styles.chipActive : ''}`}
              >
                {cat}
              </button>
            ))}
            <button
              type="button"
              onClick={() => updateFilter({ ...filterState, featured: !filterState.featured })}
              aria-pressed={filterState.featured}
              className={`${styles.chip} ${filterState.featured ? styles.chipActive : ''}`}
            >
              精选
            </button>
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => updateFilter({ ...filterState, difficulty: level })}
                aria-pressed={filterState.difficulty === level}
                className={`${styles.chip} ${filterState.difficulty === level ? styles.chipActive : ''}`}
              >
                {level === 'all'
                  ? '全部难度'
                  : level === 'beginner'
                    ? '初级'
                    : level === 'intermediate'
                      ? '中级'
                      : '高级'}
              </button>
            ))}
          </div>
          <p className={styles.resultMeta}>共 {filteredWorks.length} 条结果</p>
        </div>

        {filteredWorks.length ? (
          <div className={styles.grid}>
            {filteredWorks.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <h3>当前筛选条件下暂无作品</h3>
            <p>可以放宽分类、精选或难度条件后再试。</p>
            <button
              type="button"
              onClick={() =>
                updateFilter({
                  category: 'All',
                  featured: false,
                  difficulty: 'all',
                })
              }
            >
              返回全部作品
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
