import type { CommentPanelProps } from './types'
import Composer from './Composer'
import ThreadView from './ThreadView'
import styles from './comment-panel.module.css'

// 该组件用于承载评论内容区（线程列表 + 输入区），与容器形态无关。
export default function CommentPanel({ selection, onSubmit }: CommentPanelProps) {
  return (
    <div className={styles.panel}>
      <ThreadView selection={selection} />
      <Composer onSubmit={onSubmit} />
    </div>
  )
}
