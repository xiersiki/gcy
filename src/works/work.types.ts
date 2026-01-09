export type WorkMeta = {
  id: string
  title: string
  description?: string
  tags?: string[]
}

export type WorkRegistryItem = {
  meta: WorkMeta
  loader: () => Promise<{ default: React.ComponentType }>
}
