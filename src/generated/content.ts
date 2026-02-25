import type { AuthorProfile, WorkEntry, WorkIndexItem, WorkMeta } from '../models/content'

export const authors: Record<string, AuthorProfile> = {
  gcy: {
    id: 'gcy',
    name: 'GCY',
    bio: 'Frontend engineer focusing on interactive systems, content-driven workflows, and practical UI engineering case studies.',
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    links: {
      github: 'https://github.com/bytedance',
      x: 'https://x.com/',
      website: 'https://gcy.dev',
    },
  },
}

export const works: Record<string, { id: string; authorId: string; slug: string; meta: WorkMeta }> =
  {
    'gcy/perf-lab-demo': {
      id: 'gcy/perf-lab-demo',
      authorId: 'gcy',
      slug: 'perf-lab-demo',
      meta: {
        title: 'Perf Lab Demo',
        summary: '通过虚拟列表与可视化指标面板演示列表渲染优化，帮助快速比较不同渲染策略的开销。',
        type: 'demo',
        date: '2026-02-20',
        locale: 'zh',
        readingTime: 6,
        featured: true,
        difficulty: 'intermediate',
        tags: ['demo', 'performance', 'virtual-list', 'profiling'],
        category: 'Web App',
        cover:
          'https://images.unsplash.com/photo-1551281044-8b9a1c1f3f1a?auto=format&fit=crop&w=1200&q=80',
        demo: {
          kind: 'iframe',
          src: '/demos/gcy/perf-lab-demo/index.html',
          devSrc: 'http://localhost:5173/',
          height: 720,
        },
        external: {
          repoUrl: 'https://github.com/bytedance/gcy',
        },
      },
    },
    'gcy/layout-motion-demo': {
      id: 'gcy/layout-motion-demo',
      authorId: 'gcy',
      slug: 'layout-motion-demo',
      meta: {
        title: 'Layout Motion Demo',
        summary: '聚焦布局变更动画的编排策略，展示过滤、重排与过渡状态下的连续性体验设计。',
        type: 'demo',
        date: '2026-02-18',
        locale: 'zh',
        readingTime: 6,
        featured: true,
        difficulty: 'intermediate',
        tags: ['demo', 'motion', 'layout', 'interaction'],
        category: 'Web App',
        cover:
          'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
        demo: {
          kind: 'iframe',
          src: '/demos/gcy/layout-motion-demo/index.html',
          devSrc: 'http://localhost:5173/',
          height: 720,
        },
        external: {
          repoUrl: 'https://github.com/bytedance/gcy',
        },
      },
    },
    'gcy/form-schema-demo': {
      id: 'gcy/form-schema-demo',
      authorId: 'gcy',
      slug: 'form-schema-demo',
      meta: {
        title: 'Form Schema Demo',
        summary: '以 schema 驱动表单渲染和校验，演示字段配置化、动态联动和错误提示的一体化实现。',
        type: 'demo',
        date: '2026-02-14',
        locale: 'zh',
        readingTime: 7,
        featured: false,
        difficulty: 'advanced',
        tags: ['demo', 'form', 'schema-driven', 'validation'],
        category: 'Engineering',
        cover:
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        demo: {
          kind: 'iframe',
          src: '/demos/gcy/form-schema-demo/index.html',
          devSrc: 'http://localhost:5173/',
          height: 760,
        },
        external: {
          repoUrl: 'https://github.com/bytedance/gcy',
        },
      },
    },
    'gcy/theme-token-demo': {
      id: 'gcy/theme-token-demo',
      authorId: 'gcy',
      slug: 'theme-token-demo',
      meta: {
        title: 'Theme Token Demo',
        summary: '展示设计 Token 在主题切换和组件样式中的落地方式，验证从变量到组件的一致性映射。',
        type: 'demo',
        date: '2026-02-10',
        locale: 'zh',
        readingTime: 6,
        featured: false,
        difficulty: 'beginner',
        tags: ['demo', 'design-system', 'token', 'theming'],
        category: 'Web App',
        cover:
          'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80',
        demo: {
          kind: 'iframe',
          src: '/demos/gcy/theme-token-demo/index.html',
          devSrc: 'http://localhost:5173/',
          height: 680,
        },
        external: {
          repoUrl: 'https://github.com/bytedance/gcy',
        },
      },
    },
    'gcy/comment-architecture-case': {
      id: 'gcy/comment-architecture-case',
      authorId: 'gcy',
      slug: 'comment-architecture-case',
      meta: {
        title: 'Comment Architecture Case',
        summary:
          '复盘划词评论系统从原型到可协作版本的架构演进，覆盖状态管理、锚点稳定性与工程边界划分。',
        type: 'case-study',
        date: '2026-02-06',
        locale: 'zh',
        readingTime: 12,
        featured: true,
        difficulty: 'advanced',
        tags: ['case-study', 'comment-system', 'architecture', 'state-management'],
        category: 'Case Study',
        cover:
          'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80',
        external: {
          repoUrl: 'https://github.com/bytedance/gcy',
        },
      },
    },
    'gcy/portfolio-content-pipeline-case': {
      id: 'gcy/portfolio-content-pipeline-case',
      authorId: 'gcy',
      slug: 'portfolio-content-pipeline-case',
      meta: {
        title: 'Portfolio Content Pipeline Case',
        summary: '复盘作品站内容流水线设计，涵盖 YAML/MDX 校验、索引生成和发布稳定性保障。',
        type: 'case-study',
        date: '2026-02-04',
        locale: 'zh',
        readingTime: 10,
        featured: true,
        difficulty: 'intermediate',
        tags: ['case-study', 'content-pipeline', 'mdx', 'validation'],
        category: 'Case Study',
        cover:
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        external: {
          repoUrl: 'https://github.com/bytedance/gcy',
        },
      },
    },
    'gcy/raf-throttle-snippet': {
      id: 'gcy/raf-throttle-snippet',
      authorId: 'gcy',
      slug: 'raf-throttle-snippet',
      meta: {
        title: 'RAF Throttle Snippet',
        summary: '一个基于 requestAnimationFrame 的节流工具片段，适用于滚动与拖拽等高频事件场景。',
        type: 'snippet',
        date: '2026-02-02',
        locale: 'zh',
        readingTime: 4,
        featured: false,
        difficulty: 'beginner',
        tags: ['snippet', 'performance', 'raf', 'utility'],
        category: 'Snippet',
        external: {
          repoUrl: 'https://github.com/bytedance/gcy',
        },
      },
    },
    'gcy/url-state-sync-snippet': {
      id: 'gcy/url-state-sync-snippet',
      authorId: 'gcy',
      slug: 'url-state-sync-snippet',
      meta: {
        title: 'URL State Sync Snippet',
        summary: '将页面筛选状态与 URL 查询参数同步的可复用片段，支持刷新恢复和可分享链接。',
        type: 'snippet',
        date: '2026-01-30',
        locale: 'zh',
        readingTime: 5,
        featured: false,
        difficulty: 'intermediate',
        tags: ['snippet', 'url-state', 'routing', 'usability'],
        category: 'Snippet',
        external: {
          repoUrl: 'https://github.com/bytedance/gcy',
        },
      },
    },
    'gcy/comment': {
      id: 'gcy/comment',
      authorId: 'gcy',
      slug: 'comment',
      meta: {
        title: 'Comment Work',
        summary: '面向长文档场景的划词评论 demo，演示 anchor 定位、评论线程与状态同步的完整链路。',
        type: 'demo',
        date: '2026-01-12',
        locale: 'zh',
        readingTime: 7,
        featured: true,
        difficulty: 'advanced',
        tags: ['demo', 'comment-system', 'annotation', 'interaction'],
        category: 'Web App',
        cover:
          'https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=1200&q=80',
        demo: {
          kind: 'iframe',
          src: '/demos/gcy/comment/index.html',
          devSrc: 'http://localhost:5173/',
          height: 720,
        },
        external: {
          repoUrl: 'https://github.com/bytedance/gcy',
        },
      },
    },
    'gcy/demo2': {
      id: 'gcy/demo2',
      authorId: 'gcy',
      slug: 'demo2',
      meta: {
        title: 'Demo Work 2',
        summary:
          '用于演示 iframe 自适应与基础交互状态管理的独立 demo，验证作品卡片与标签聚合流程。',
        type: 'demo',
        date: '2026-01-02',
        locale: 'zh',
        readingTime: 5,
        featured: false,
        difficulty: 'beginner',
        tags: ['demo', 'iframe', 'resize', 'state'],
        category: 'Web App',
        cover:
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        demo: {
          kind: 'iframe',
          src: '/demos/gcy/demo2/index.html',
          devSrc: 'http://localhost:5173/',
          height: 720,
        },
        external: {
          repoUrl: 'https://github.com/bytedance/gcy',
        },
      },
    },
  }

export const workLoaders: Record<string, WorkEntry['load']> = {
  'gcy/perf-lab-demo': () => import('./../../content/works/gcy/perf-lab-demo/index.mdx'),
  'gcy/layout-motion-demo': () => import('./../../content/works/gcy/layout-motion-demo/index.mdx'),
  'gcy/form-schema-demo': () => import('./../../content/works/gcy/form-schema-demo/index.mdx'),
  'gcy/theme-token-demo': () => import('./../../content/works/gcy/theme-token-demo/index.mdx'),
  'gcy/comment-architecture-case': () =>
    import('./../../content/works/gcy/comment-architecture-case/index.mdx'),
  'gcy/portfolio-content-pipeline-case': () =>
    import('./../../content/works/gcy/portfolio-content-pipeline-case/index.mdx'),
  'gcy/raf-throttle-snippet': () =>
    import('./../../content/works/gcy/raf-throttle-snippet/index.mdx'),
  'gcy/url-state-sync-snippet': () =>
    import('./../../content/works/gcy/url-state-sync-snippet/index.mdx'),
  'gcy/comment': () => import('./../../content/works/gcy/comment/index.mdx'),
  'gcy/demo2': () => import('./../../content/works/gcy/demo2/index.mdx'),
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
  new Set(
    worksList
      .filter((w) => w.type !== 'idea' && !w.draft)
      .map((w) => w.category)
      .filter((c): c is string => Boolean(c)),
  ),
).sort()
