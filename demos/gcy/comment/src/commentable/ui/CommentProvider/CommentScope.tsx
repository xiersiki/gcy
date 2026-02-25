// 引入 ReactNode 类型，用于声明 children 的类型。
import { useRef, useState } from 'react'
// 从 selection 引擎导入读取选区快照的方法：它只负责“读 Selection + 算 rects”，不做规则校验。
// 从 selection guard 导入规则校验：负责 minLength、容器范围、禁用区域等判定。
import FloatingCommentButton from '../FloatingCommentButton'
import type { CommentScopeProps } from '../comment-presenters/types'
import { useSelectionWatcher } from './use-selection-watcher'
import CommentPopover from '../comment-presenters/comment-popover'
import type { SelectionSnapshot } from '../../core/selection/SelectionEngine'
// CommentScope 是可评论能力的根容器：未来会负责监听选区、渲染按钮/抽屉/高亮等。
export default function CommentScope({ children }: CommentScopeProps) {
  // 创建一个 ref，用来拿到 CommentScope 根容器的真实 DOM 节点。
  const rootElement = useRef<HTMLDivElement>(null)
  const [commentPopoverVisible, setCommentPopoverVisible] = useState(false)
  const [activeSelection, setActiveSelection] = useState<SelectionSnapshot | null>(null)
  const { pendingSelection } = useSelectionWatcher({ rootElement })

  const handleClick = (selection: SelectionSnapshot) => {
    setActiveSelection(selection)
    setCommentPopoverVisible(true)
  }

  const handleClose = () => {
    setCommentPopoverVisible(false)
    setActiveSelection(null)
  }

  const handleSubmit = (text: string) => {
    console.info('[comment]', {
      selection: activeSelection?.text,
      text,
    })
    handleClose()
  }

  // 渲染一个 div 作为 CommentScope 根容器，并把 ref 绑上以获得真实 DOM。
  return (
    <div ref={rootElement} data-commentable-has-selection={pendingSelection ? '1' : '0'}>
      {/* children 是被包裹的业务内容；CommentScope 不改变内容结构，只在外层增强能力 */}
      {children}
      {pendingSelection && (
        <FloatingCommentButton
          key={pendingSelection.direction}
          rect={pendingSelection.rect}
          direction={pendingSelection.direction}
          range={pendingSelection.range}
          onClick={() => handleClick(pendingSelection)}
        />
      )}
      {activeSelection && (
        <CommentPopover
          visible={commentPopoverVisible}
          selection={activeSelection}
          onClose={handleClose}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
