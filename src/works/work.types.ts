import type { ComponentType } from 'react'

export type WorkMeta = {
  id: string
  title: string
  description?: string
  tags?: string[]
  category?: string
  thumbnail?: string
  date?: string
}

export type WorkRegistryItem = {
  meta: WorkMeta
  loader: () => Promise<{ default: ComponentType }>
}
