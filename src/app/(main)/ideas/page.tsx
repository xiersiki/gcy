import { authors } from '@/generated/content'
import type { IdeaIndexItem } from '@/models/idea'
import { IdeasPageContent } from '@/features/works/IdeasPageContent'
import { getSupabaseEnv } from '@/server/supabase/env'
import { getSupabaseServerClient } from '@/server/supabase/server'

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
        initialCommunityIdeas = data.map((row) => {
          const r = row as Record<string, unknown>
          const authorId = String(r.author_id ?? '')
          const slug = String(r.slug ?? '')
          const createdAt = String(r.created_at ?? '')
          const statusRaw = String(r.status ?? 'open')
          const statusNormalized =
            statusRaw === 'in-progress' || statusRaw === 'done' || statusRaw === 'open'
              ? statusRaw
              : 'open'
          return {
            id: `${authorId}/${slug}`,
            authorId,
            slug,
            title: String(r.title ?? ''),
            summary: String(r.summary ?? ''),
            date: createdAt ? createdAt.slice(0, 10) : '',
            tags: Array.isArray(r.tags) ? (r.tags as string[]) : undefined,
            idea: {
              status: statusNormalized,
              claimedBy: r.claimed_by ? String(r.claimed_by) : undefined,
              claimedAt: r.claimed_at ? String(r.claimed_at) : undefined,
              claimPrUrl: r.claim_pr_url ? String(r.claim_pr_url) : undefined,
              implementedWorkId: r.implemented_work_id ? String(r.implemented_work_id) : undefined,
              pending: false,
            },
            source: 'supabase',
          } satisfies IdeaIndexItem
        })
      }
    }
  } catch {
    initialCommunityIdeas = []
  }

  return <IdeasPageContent authors={authors} initialCommunityIdeas={initialCommunityIdeas} />
}
