'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { IdeaIndexItem } from '@/models/idea'
import type { AuthorProfile } from '@/models/content'
import { BgDecor } from '@/components/shared/BgDecor'
import { IdeaBoardSection } from './IdeaBoardSection'
import { IdeaClaimModal } from './IdeaClaimModal'
import { IdeaCompleteModal } from './IdeaCompleteModal'
import { IdeaDetailsModal } from './IdeaDetailsModal'
import { IdeaPublishModal } from './IdeaPublishModal'
import boardStyles from './IdeaBoardSection.module.scss'
import styles from '@/components/shared/PageShell.module.scss'
import { useCommunityIdeas } from './hooks/useCommunityIdeas'

export type IdeasPageContentProps = {
  authors: Record<string, AuthorProfile>
  initialCommunityIdeas?: IdeaIndexItem[]
}

export function IdeasPageContent({ authors, initialCommunityIdeas }: IdeasPageContentProps) {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isClaimOpen, setIsClaimOpen] = useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const { ideas: communityIdeas, upsertIdea } = useCommunityIdeas(initialCommunityIdeas)

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
          upsertIdea(idea)
          setSelectedIdeaId(idea.id)
        }}
      />
    </div>
  )
}
