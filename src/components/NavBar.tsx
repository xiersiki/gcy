import Link from 'next/link'

import { AuthButton } from './AuthButton'
import styles from './NavBar.module.css'

export function NavBar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.navbarInner}>
        <Link href="/" className={styles.brand}>
          Portfolio
        </Link>

        <nav className={styles.nav}>
          <Link href="/works" className={styles.navLink}>
            Works
          </Link>
          <Link href="/authors" className={styles.navLink}>
            Authors
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  )
}
