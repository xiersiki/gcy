'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import styles from './BackButton.module.scss'

export type BackButtonProps = {
  href?: string
  label?: string
}

export function BackButton({ href, label = 'Back' }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <button className={styles.backBtn} onClick={handleClick}>
      <div className={styles.iconWrapper}>
        <ArrowLeft size={16} />
      </div>
      <span>{label}</span>
    </button>
  )
}
