// 该文件用于声明评论面板的呈现层类型与对外契约。
import type { ReactNode } from 'react'
import type { SelectionSnapshot } from '../../core/selection/SelectionEngine'

export type CommentViewMode = 'drawer' | 'side'

export type CommentController = {
  open: boolean
  mode: CommentViewMode
  selection: SelectionSnapshot | null
  openForSelection: (selection: SelectionSnapshot) => void
  close: () => void
  submit: (text: string) => Promise<void>
}

export type CommentContainerProps = {
  controller: CommentController
}

export type CommentScopeProps = {
  children: ReactNode
  mode?: CommentViewMode
}
