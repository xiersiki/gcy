'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { AuthorProfile, WorkIndexItem } from '@/models/content'
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

export function IdeasPageContent({ authors, works }: IdeasPageContentProps) {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isClaimOpen, setIsClaimOpen] = useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [communityIdeasRemote, setCommunityIdeasRemote] = useState<WorkIndexItem[]>([])

  const boardItems = useMemo(() => {
    return works
      .filter((w) => w.type === 'idea' && !w.draft)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [works])

  useEffect(() => {
    let cancelled = false
    fetch('/api/ideas/community')
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => {
        if (cancelled) return
        const maybe = list as { ok?: unknown; data?: unknown } | null
        const data = maybe && maybe.ok === true ? maybe.data : null
        setCommunityIdeasRemote(Array.isArray(data) ? (data as WorkIndexItem[]) : [])
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
    const byId = new Map<string, WorkIndexItem>()
    for (const it of communityIdeasRemote) byId.set(it.id, it)
    for (const it of boardItems) byId.set(it.id, it)
    return Array.from(byId.values()).sort((a, b) => b.date.localeCompare(a.date))
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
        onPublished={(idea: WorkIndexItem) => {
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
