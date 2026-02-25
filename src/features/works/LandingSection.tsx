'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { BgDecor } from '@/components/shared/BgDecor'
import layoutStyles from '@/components/shared/LayoutShell.module.scss'
import styles from '@/components/shared/HeroSection.module.scss'

export function LandingSection() {
  return (
    <div className={layoutStyles.container}>
      <BgDecor />

      <section className={styles.hero}>
        <motion.div
          className={styles.badge}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles size={16} />
          <span>内容驱动 · 持续迭代</span>
        </motion.div>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          用作品沉淀 <span className={styles.gradientText}>可复用经验</span>
        </motion.h1>
        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          这里是 GCY 的前端作品集：从想法到实现，从 demo 到 case study，记录每一次交互设计、
          工程取舍与复盘结果，形成可持续演进的内容资产。
        </motion.p>
        <motion.div
          className={styles.heroActions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/works" className={styles.primaryBtn}>
            浏览作品
            <ArrowRight size={20} strokeWidth={2.5} />
          </Link>
          <Link href="/ideas" className={styles.secondaryBtn}>
            查看想法池
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
