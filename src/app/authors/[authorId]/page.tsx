import Link from 'next/link'
import { notFound } from 'next/navigation'

import { authors, worksList } from '@/generated/content'

export async function generateStaticParams() {
  return Object.values(authors).map((a) => ({ authorId: a.id }))
}

export default async function AuthorPage({ params }: { params: Promise<{ authorId: string }> }) {
  const { authorId } = await params
  const author = authors[authorId]
  if (!author) notFound()

  const works = worksList.filter((w) => w.authorId === author.id && !w.draft)

  return (
    <main>
      <h1>{author.name}</h1>
      {author.bio ? <p>{author.bio}</p> : null}
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
