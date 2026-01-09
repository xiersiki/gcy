export interface WorkMeta {
  id: string
  title: string
  description?: string
  category: string
  thumbnail: string
  date: string
  tags: string[]
}

export interface WorkItem {
  meta: WorkMeta
}

export type WorkRegistry = WorkItem[]
