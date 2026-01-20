'use client'

import { motion } from 'framer-motion'
import styles from './PageShell.module.scss'

export function BgDecor() {
  return (
    <div className={styles.bgDecor}>
      <motion.div
        className={styles.blob1}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className={styles.blob2}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{ duration: 12, repeat: Infinity, delay: 1 }}
      />
    </div>
  )
}
