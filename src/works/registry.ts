import type { WorkRegistryItem } from './work.types'

export const worksRegistry: WorkRegistryItem[] = [
  {
    meta: {
      id: 'demo',
      title: 'Demo Work',
      description: '示例作品入口，用于验证路由与目录架构。',
      tags: ['demo'],
      category: 'Web App',
      date: '2026-01',
    },
    loader: () => import('./demo/DemoWork'),
  },
  {
    meta: {
      id: 'demo2',
      title: 'Demo Work 2',
      description: '示例作品入口，用于验证路由与目录架构。',
      tags: ['demo2'],
      category: 'Web App',
      date: '2026-01',
    },
    loader: () => import('./demo2/DemoWork'),
  },
]

export function findWorkById(id: string) {
  return worksRegistry.find((item) => item.meta.id === id)
}
