'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { BgDecor } from '@/components/shared/BgDecor'
import styles from '@/components/shared/PageShell.module.scss'

export function LandingSection() {
  return (
    <div className={styles.container}>
      <BgDecor />

      <section className={styles.hero}>
        <motion.div
          className={styles.badge}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles size={16} className="text-amber-400" />
          <span>Community Driven</span>
        </motion.div>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Build the <span className={styles.gradientText}>Future</span> together.
        </motion.h1>
        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          The showcase for the world's most innovative web components. Propose ideas, accept
          challenges, and see your code come to life in our global gallery.
        </motion.p>
        <motion.div
          className={styles.heroActions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/works" className={styles.primaryBtn}>
            Explore Works
            <ArrowRight size={20} strokeWidth={2.5} />
          </Link>
          <Link href="/ideas" className={styles.secondaryBtn}>
            Contribute Ideas
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
