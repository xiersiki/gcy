import type { ReactNode } from 'react'
import { NavBar } from '@/components/NavBar'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <NavBar />
      <div className="pageContainer">{children}</div>
    </>
  )
}
