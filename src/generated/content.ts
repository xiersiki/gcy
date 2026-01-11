import type { AuthorProfile, WorkEntry, WorkIndexItem, WorkMeta } from '../models/content'

export const authors: Record<string, AuthorProfile> = {
  gcy: {
    id: 'gcy',
    name: 'GCY',
    bio: 'Frontend ideas & experiments.',
    links: {
      github: 'https://github.com/',
    },
  },
}

export const works: Record<string, { id: string; authorId: string; slug: string; meta: WorkMeta }> =
  {
    'gcy/demo2': {
      id: 'gcy/demo2',
      authorId: 'gcy',
      slug: 'demo2',
      meta: {
        title: 'Demo Work 2',
        summary: '第二个示例作品，用于验证列表与标签聚合。',
        type: 'demo',
        date: '2026-01-02',
        tags: ['demo', 'demo2'],
        category: 'Web App',
        demo: {
          kind: 'iframe',
          src: '/demos/gcy/demo2/',
          devSrc: 'http://localhost:5173/',
          height: 720,
        },
      },
    },
    'gcy/demo': {
      id: 'gcy/demo',
      authorId: 'gcy',
      slug: 'demo',
      meta: {
        title: 'Demo Work',
        summary: '示例作品，用于验证内容管线与路由。',
        type: 'idea',
        date: '2026-01-01',
        tags: ['demo'],
        category: 'Web App',
      },
    },
  }

export const workLoaders: Record<string, WorkEntry['load']> = {
  'gcy/demo2': () => import('./../../content/works/gcy/demo2/index.mdx'),
  'gcy/demo': () => import('./../../content/works/gcy/demo/index.mdx'),
}

export const worksList = Object.values(works).map((w) => ({
  id: w.id,
  authorId: w.authorId,
  slug: w.slug,
  ...w.meta,
})) as WorkIndexItem[]

export const tagsIndex = worksList.reduce(
  (acc, w) => {
    for (const tag of w.tags ?? []) {
      acc[tag] ||= []
      acc[tag].push(w.id)
    }
    return acc
  },
  {} as Record<string, string[]>,
)

export const categories = Array.from(
  new Set(worksList.map((w) => w.category).filter((c): c is string => Boolean(c))),
).sort()
