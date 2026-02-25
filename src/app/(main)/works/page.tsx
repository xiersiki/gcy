import { Suspense } from 'react'
import { categories, worksList } from '@/generated/content'
import { WorksPageContent } from '@/features/works/WorksPageContent'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WorksPageContent works={worksList} categories={categories} />
    </Suspense>
  )
}
