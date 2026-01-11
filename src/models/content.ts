import type { ComponentType } from 'react'

export type AuthorProfile = {
  id: string
  name: string
  bio?: string
  avatar?: string
  links?: Record<string, string>
}

export type WorkType = 'case-study' | 'idea' | 'demo' | 'snippet'

export type WorkDemo = {
  kind: 'iframe'
  src: string
  devSrc?: string
  height?: number
}

export type WorkMeta = {
  title: string
  summary: string
  type: WorkType
  date: string
  tags?: string[]
  category?: string
  cover?: string
  draft?: boolean
  demo?: WorkDemo
  external?: {
    demoUrl?: string
    repoUrl?: string
    figmaUrl?: string
  }
}

export type WorkEntry = {
  id: string
  authorId: string
  slug: string
  meta: WorkMeta
  load: () => Promise<{ default: ComponentType }>
}

export type WorkIndexItem = WorkMeta & {
  id: string
  authorId: string
  slug: string
}
