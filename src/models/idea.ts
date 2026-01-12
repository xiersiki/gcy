export type IdeaStatus = 'open' | 'in-progress' | 'done'

export type IdeaMeta = {
  status: IdeaStatus
  claimedBy?: string
  claimedAt?: string
  claimPrUrl?: string
  implementedWorkId?: string
  implementedPrUrl?: string
  branch?: string
  compareUrl?: string
  pending?: boolean
}

export type IdeaIndexItem = {
  id: string
  authorId: string
  slug: string
  title: string
  summary: string
  date: string
  tags?: string[]
  idea: IdeaMeta
  source: 'content' | 'supabase'
}
