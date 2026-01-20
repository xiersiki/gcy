import { notFound } from 'next/navigation'

import { BackButton } from '@/components/BackButton'
import { WorkCard } from '@/features/works/WorkCard'
import { tagsIndex, worksList } from '@/generated/content'
import styles from '@/components/shared/CollectionSection.module.scss'

export async function generateStaticParams() {
  return Object.keys(tagsIndex).map((tag) => ({ tag }))
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  const workIds = tagsIndex[tag]
  if (!workIds?.length) notFound()

  const works = worksList.filter((w) => workIds.includes(w.id) && !w.draft)

  return (
    <main>
      <BackButton label="Back to All Works" />

      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.sectionTitle}>{`#${tag}`}</h1>
          <p className={styles.sectionSubtitle}>{`Found ${works.length} works with this tag.`}</p>
        </div>
      </div>

      <div className={styles.grid}>
        {works.map((w) => (
          <WorkCard key={w.id} work={w} />
        ))}
      </div>
    </main>
  )
}
