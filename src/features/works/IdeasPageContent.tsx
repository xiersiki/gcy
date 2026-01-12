'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { AuthorProfile, WorkIndexItem } from '@/models/content'
import type { IdeaIndexItem } from '@/models/idea'
import { readApiData } from '@/shared/api'
import { BgDecor } from './BgDecor'
import { IdeaBoardSection } from './IdeaBoardSection'
import { IdeaClaimModal } from './IdeaClaimModal'
import { IdeaCompleteModal } from './IdeaCompleteModal'
import { IdeaDetailsModal } from './IdeaDetailsModal'
import { IdeaPublishModal } from './IdeaPublishModal'
import styles from './WorksHome.module.scss'
import boardStyles from './IdeaBoardSection.module.scss'

export type IdeasPageContentProps = {
  authors: Record<string, AuthorProfile>
  works: WorkIndexItem[]
}

function toIdeaIndexItemFromWork(w: WorkIndexItem): IdeaIndexItem {
  return {
    id: w.id,
    authorId: w.authorId,
    slug: w.slug,
    title: w.title,
    summary: w.summary,
    date: w.date,
    tags: w.tags,
    idea: {
      status: (w.idea?.status as IdeaIndexItem['idea']['status'] | undefined) ?? 'open',
      claimedBy: w.idea?.claimedBy,
      claimedAt: w.idea?.claimedAt,
      claimPrUrl: w.idea?.claimPrUrl,
      implementedWorkId: w.idea?.implementedWorkId,
      implementedPrUrl: w.idea?.implementedPrUrl,
      branch: w.idea?.branch,
      compareUrl: w.idea?.compareUrl,
      pending: w.idea?.pending,
    },
    source: 'content',
  }
}

export function IdeasPageContent({ authors, works }: IdeasPageContentProps) {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isClaimOpen, setIsClaimOpen] = useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [communityIdeasRemote, setCommunityIdeasRemote] = useState<IdeaIndexItem[]>([])

  const boardItems = useMemo(() => {
    return works
      .filter((w) => w.type === 'idea' && !w.draft)
      .map(toIdeaIndexItemFromWork)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [works])

  useEffect(() => {
    let cancelled = false
    fetch('/api/ideas/community')
      .then((r) => readApiData<IdeaIndexItem[]>(r))
      .then((list) => {
        if (cancelled) return
        setCommunityIdeasRemote(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (cancelled) return
        setCommunityIdeasRemote([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const communityIdeas = useMemo(() => {
    const localById = new Map<string, IdeaIndexItem>()
    for (const it of boardItems) localById.set(it.id, it)

    const remoteById = new Map<string, IdeaIndexItem>()
    for (const it of communityIdeasRemote) remoteById.set(it.id, it)

    const ids = new Set<string>([...localById.keys(), ...remoteById.keys()])
    const merged: IdeaIndexItem[] = []

    for (const id of ids) {
      const local = localById.get(id)
      const remote = remoteById.get(id)
      if (local && remote) {
        merged.push({
          id,
          authorId: local.authorId,
          slug: local.slug,
          title: local.title || remote.title,
          summary: local.summary || remote.summary,
          date: remote.date || local.date,
          tags: remote.tags ?? local.tags,
          idea: {
            ...local.idea,
            ...remote.idea,
            status: remote.idea.status,
          },
          source: 'supabase',
        })
        continue
      }
      merged.push(local ?? (remote as IdeaIndexItem))
    }

    merged.sort((a, b) => b.date.localeCompare(a.date))
    return merged
  }, [boardItems, communityIdeasRemote])

  const selectedIdea = useMemo(() => {
    if (!selectedIdeaId) return null
    return communityIdeas.find((w) => w.id === selectedIdeaId) ?? null
  }, [communityIdeas, selectedIdeaId])

  return (
    <div className={styles.container}>
      <BgDecor />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Ideas & Proposals</h2>
            <p className={styles.sectionSubtitle}>
              Suggest a component you'd like to see, or claim an existing idea to implement it
              through a Pull Request.
            </p>
          </div>
          <button
            type="button"
            className={boardStyles.boardPublishButton}
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus size={18} />
            Post New Idea
          </button>
        </div>

        <IdeaBoardSection
          authors={authors}
          ideas={communityIdeas}
          onSelectIdea={(id) => setSelectedIdeaId(id)}
        />
      </motion.div>

      <IdeaDetailsModal
        authors={authors}
        idea={selectedIdea}
        onClose={() => setSelectedIdeaId(null)}
        onOpenClaim={() => setIsClaimOpen(true)}
        onOpenComplete={() => setIsCompleteOpen(true)}
      />
      <IdeaClaimModal
        open={isClaimOpen}
        idea={selectedIdea}
        authors={authors}
        onClose={() => setIsClaimOpen(false)}
      />
      <IdeaCompleteModal
        open={isCompleteOpen}
        idea={selectedIdea}
        authors={authors}
        onClose={() => setIsCompleteOpen(false)}
      />
      <IdeaPublishModal
        authors={authors}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPublished={(idea) => {
          setCommunityIdeasRemote((prev) => {
            const next = [idea, ...prev.filter((it) => it.id !== idea.id)]
            next.sort((a, b) => b.date.localeCompare(a.date))
            return next
          })
          setSelectedIdeaId(idea.id)
        }}
      />
    </div>
  )
}
