'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Heart, LayoutGrid, MessageSquare } from 'lucide-react'
import Link from 'next/link'

import type { WorkIndexItem } from '@/models/content'

import { useWorkStats } from './hooks/useWorkStats'
import styles from './WorkCard.module.scss'

export type WorkCardProps = {
  work: WorkIndexItem
}

export function WorkCard({ work }: WorkCardProps) {
  const href = `/works/${work.authorId}/${work.slug}`
  const { data } = useWorkStats(work.authorId, work.slug)

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Link href={href} prefetch={false} className={styles.cover}>
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
            <Link href={href} prefetch={false}>
              {work.title}
            </Link>
          </h3>
          <span className={styles.authorBadge}>@{work.authorId}</span>
        </div>

        <p className={styles.summary}>{work.summary}</p>

        <div className={styles.tags}>
          {work.tags?.slice(0, 3).map((tag) => (
            <Link key={tag} href={`/tags/${tag}`} prefetch={false} className={styles.tag}>
              {tag}
            </Link>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.stat}>
            <Heart size={14} />
            <span>{data?.likeCount ?? 0}</span>
          </div>
          <div className={styles.stat}>
            <MessageSquare size={14} />
            <span>{data?.commentCount ?? 0}</span>
          </div>
          <Link href={href} className={styles.actionIcon}>
            <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
