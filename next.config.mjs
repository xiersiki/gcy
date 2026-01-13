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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  eslint: { ignoreDuringBuilds: true },
  env: {
    ...(supabaseUrl ? { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl } : {}),
    ...(supabaseAnonKey ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey } : {}),
  },
  ...(isExport ? { output: 'export' } : {}),
}

export default withMDX(nextConfig)
