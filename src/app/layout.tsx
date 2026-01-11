import type { ReactNode } from 'react'

import { NavBar } from '@/components/NavBar'

import '@arco-design/web-react/dist/css/arco.css'
import './globals.css'

export const metadata = {
  title: 'Portfolio',
  description: 'A small collection of frontend ideas and works.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <NavBar />
        <div className="pageContainer">{children}</div>
      </body>
    </html>
  )
}
