'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Heart, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import type { WorkIndexItem } from '@/models/content'

import styles from './WorkCard.module.scss'

export type WorkCardProps = {
  work: WorkIndexItem
}

export function WorkCard({ work }: WorkCardProps) {
  const href = `/works/${work.authorId}/${work.slug}`

  // 简单的确定性伪随机数，避免 linter 报错并保持重新渲染一致性
  const likes = useMemo(() => {
    const hash = work.slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return (hash % 150) + 50
  }, [work.slug])

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Link href={href} className={styles.cover}>
        {work.cover ? (
          <img src={work.cover} alt={work.title} />
        ) : (
          <div className={styles.placeholder}>
            <LayoutGrid size={48} />
          </div>
        )}
        <div className={styles.overlay} />
      </Link>
      <div className={styles.body}>
        <div className={styles.headerRow}>
          <h3 className={styles.title}>
            <Link href={href}>{work.title}</Link>
          </h3>
          <span className={styles.authorBadge}>@{work.authorId}</span>
        </div>

        <p className={styles.summary}>{work.summary}</p>

        <div className={styles.tags}>
          {work.tags?.slice(0, 3).map((tag) => (
            <Link key={tag} href={`/tags/${tag}`} className={styles.tag}>
              {tag}
            </Link>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.stat}>
            <Heart size={14} />
            <span>{likes}</span>
          </div>
          <Link href={href} className={styles.actionIcon}>
            <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
