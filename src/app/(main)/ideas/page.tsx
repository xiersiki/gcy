export const runtime = 'edge'

import { authors } from '@/generated/content'
import type { IdeaIndexItem } from '@/models/idea'
import { IdeasPageContent } from '@/features/ideas/IdeasPageContent'
import { getSupabaseEnv } from '@/server/supabase/env'
import { getSupabaseServerClient } from '@/server/supabase/server'
import { mapIdeaRowToIndexItem } from '@/shared/ideas/mapper'

export default async function Page() {
  let initialCommunityIdeas: IdeaIndexItem[] = []
  try {
    const { url, anonKey } = getSupabaseEnv()
    if (url && anonKey) {
      const supabase = await getSupabaseServerClient()
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)
      if (!error && data) {
        initialCommunityIdeas = data.map((row) =>
          mapIdeaRowToIndexItem(row as Record<string, unknown>),
        )
      }
    }
  } catch {
    initialCommunityIdeas = []
  }

  return <IdeasPageContent authors={authors} initialCommunityIdeas={initialCommunityIdeas} />
}
