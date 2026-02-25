'use client'

import styles from './BgDecor.module.scss'

export function BgDecor() {
  return (
    <div className={styles.bgDecor}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />
    </div>
  )
}
