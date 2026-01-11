import Link from 'next/link'

import type { WorkIndexItem } from '@/models/content'

import styles from './WorkCard.module.css'

export type WorkCardProps = {
  work: WorkIndexItem
}

export function WorkCard({ work }: WorkCardProps) {
  const href = `/works/${work.authorId}/${work.slug}`

  return (
    <div className={styles.card}>
      <Link href={href} aria-label={work.title}>
        <div className={styles.cover}>
          {work.cover ? <img src={work.cover} alt={work.title} /> : null}
        </div>
      </Link>

      <div className={styles.body}>
        <div className={styles.metaRow}>
          <span className={styles.category}>{work.category ?? work.type}</span>
          <span className={styles.date}>{work.date}</span>
        </div>

        <h3 className={styles.title}>
          <Link href={href}>{work.title}</Link>
        </h3>

        <p className={styles.summary}>{work.summary}</p>

        {work.tags?.length ? (
          <div className={styles.tags}>
            {work.tags.map((tag) => (
              <Link key={tag} href={`/tags/${tag}`} className={styles.tag}>
                {tag}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
