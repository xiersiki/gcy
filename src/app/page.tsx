import { categories, worksList } from '@/generated/content'
import { WorksHome } from '@/features/works/WorksHome'

export default function Page() {
  return <WorksHome works={worksList} categories={['All', ...categories]} />
}
