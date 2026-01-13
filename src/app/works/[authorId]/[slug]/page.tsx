import { notFound } from 'next/navigation'
import { authors, workLoaders, works } from '@/generated/content'
import { WorkDetailClient } from '@/features/works/WorkDetailClient'

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

  const demoUrl =
    work.meta.demo?.kind === 'iframe'
      ? process.env.NODE_ENV === 'development' && work.meta.demo.devSrc
        ? work.meta.demo.devSrc
        : (work.meta.demo.src ??
          (work.meta.demo.demoId ? `/demos/${work.meta.demo.demoId}/index.html` : undefined))
      : undefined

  return (
    <WorkDetailClient work={work} author={author} mdxContent={<MdxContent />} demoUrl={demoUrl} />
  )
}
