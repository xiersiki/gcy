// 该组件用于展示某个 Anchor 下的评论线程列表（主评论 + 回复）。
import type { ThreadViewProps } from './types'
import styles from './comment-panel.module.css'
export default function ThreadView({ selection }: ThreadViewProps) {
  return (
    <section className={styles.thread}>
      <p className={styles.threadLabel}>当前引用</p>
      <blockquote className={styles.quote}>{selection?.text || ''}</blockquote>
    </section>
  )
}
