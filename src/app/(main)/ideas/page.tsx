import { authors, worksList } from '@/generated/content'
import { IdeasPageContent } from '@/features/works/IdeasPageContent'

export default function Page() {
  return <IdeasPageContent authors={authors} works={worksList} />
}
