import { notFound } from 'next/navigation'
import Link from 'next/link'

import { DemoFrame } from '@/components/demo/DemoFrame'
import { authors, workLoaders, works } from '@/generated/content'

export async function generateStaticParams() {
  return Object.values(works)
    .filter((w) => !w.meta.draft)
    .map((w) => ({ authorId: w.authorId, slug: w.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ authorId: string; slug: string }>
}) {
  const { authorId, slug } = await params
  const id = `${authorId}/${slug}`
  const work = works[id]
  if (!work || work.meta.draft) return {}
  return {
    title: work.meta.title,
    description: work.meta.summary,
  }
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ authorId: string; slug: string }>
}) {
  const { authorId, slug } = await params
  const id = `${authorId}/${slug}`
  const work = works[id]
  if (!work || work.meta.draft) notFound()

  const author = authors[work.authorId]
  const loader = workLoaders[id]
  if (!loader) notFound()
  const { default: MdxContent } = await loader()

  return (
    <main>
      <header>
        <h1>{work.meta.title}</h1>
        <p>{work.meta.summary}</p>
        <div>
          <span>{work.meta.date}</span>
          {author ? <span>{` · ${author.name}`}</span> : null}
          {work.meta.sourceIdeaId ? (
            <span>
              {` · 来源：`}
              <Link
                href={`/works/${work.meta.sourceIdeaId.split('/')[0]}/${work.meta.sourceIdeaId.split('/')[1]}`}
              >
                {work.meta.sourceIdeaId}
              </Link>
            </span>
          ) : null}
        </div>
      </header>

      {work.meta.demo?.kind === 'iframe' ? (
        <DemoFrame
          src={
            process.env.NODE_ENV === 'development' && work.meta.demo.devSrc
              ? work.meta.demo.devSrc
              : work.meta.demo.src
          }
          height={work.meta.demo.height}
          title={`${work.meta.title} Demo`}
        />
      ) : null}

      <article>
        <MdxContent />
      </article>
    </main>
  )
}
