import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    providerImportSource: '@/mdx-components',
    remarkPlugins: [remarkGfm],
  },
})

const isExport = process.env.NEXT_OUTPUT === 'export'

const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  ...(isExport ? { output: 'export' } : {}),
}

export default withMDX(nextConfig)
