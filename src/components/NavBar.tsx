'use client'

import { LayoutGrid, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { AuthButton } from './AuthButton'
import { ThemeToggle } from './ThemeToggle'
import styles from './NavBar.module.scss'

export function NavBar() {
  const pathname = usePathname()

  return (
    <header className={styles.navbar}>
      <div className={styles.navbarInner}>
        <Link href="/" className={styles.brand}>
          <div className={styles.logoIcon}>
            <LayoutGrid size={20} />
          </div>
          <span className={styles.brandName}>
            Dev<span>Forge</span>
          </span>
        </Link>

        <nav className={styles.nav}>
          <Link
            href="/works"
            className={`${styles.navLink} ${pathname === '/works' ? styles.active : ''}`}
          >
            <LayoutGrid size={18} />
            Works
          </Link>
          <Link
            href="/ideas"
            className={`${styles.navLink} ${pathname === '/ideas' ? styles.active : ''}`}
          >
            <Lightbulb size={18} />
            Ideas Hub
          </Link>
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  )
}
