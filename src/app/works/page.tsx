import { authors, categories, worksList } from '@/generated/content'
import { WorksHome } from '@/features/works/WorksHome'

export default function WorksPage() {
  return <WorksHome authors={authors} works={worksList} categories={['All', ...categories]} />
}
