// 该文件用于声明评论内容区（panel）的类型与对外契约。
import type { SelectionSnapshot } from '../../core/selection/SelectionEngine'

export type CommentPanelProps = {
  selection: SelectionSnapshot | null
  onSubmit: (text: string) => void
}

export type ThreadViewProps = {
  selection: SelectionSnapshot | null
}

export type ComposerProps = {
  onSubmit: (text: string) => void
}
