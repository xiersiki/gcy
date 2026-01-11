import Link from 'next/link'
import { notFound } from 'next/navigation'

import { tagsIndex, worksList } from '@/generated/content'

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
      <h1>{`#${tag}`}</h1>
      <ul>
        {works.map((w) => (
          <li key={w.id}>
            <Link href={`/works/${w.authorId}/${w.slug}`}>{w.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
