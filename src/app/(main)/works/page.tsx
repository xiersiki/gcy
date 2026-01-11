import { categories, worksList } from '@/generated/content'
import { WorksPageContent } from '@/features/works/WorksPageContent'

export default function Page() {
  return <WorksPageContent works={worksList} categories={['All', ...categories]} />
}
