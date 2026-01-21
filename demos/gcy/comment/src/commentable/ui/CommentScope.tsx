// 引入 ReactNode 类型，用于声明 children 的类型。
import { useEffect, useRef, useState, type ReactNode } from 'react'
// 从 selection 引擎导入读取选区快照的方法：它只负责“读 Selection + 算 rects”，不做规则校验。
import { readSelectionSnapshot } from '../core/selection/SelectionEngine'
// 从 selection guard 导入规则校验：负责 minLength、容器范围、禁用区域等判定。
import { guardSelectionSnapshot } from '../core/selection/SelectionGuard'
import FloatingCommentButton from './FloatingCommentButton'

// CommentScope 是可评论能力的根容器：未来会负责监听选区、渲染按钮/抽屉/高亮等。
export default function CommentScope({ children }: { children: ReactNode }) {
  // 创建一个 ref，用来拿到 CommentScope 根容器的真实 DOM 节点。
  const rootElement = useRef<HTMLDivElement>(null)

  // pendingSelection 用来存“当前有效选区快照”，有值时未来会显示幽灵按钮/打开抽屉。
  // 类型使用 ReturnType<typeof readSelectionSnapshot>，确保与引擎输出保持一致（要么是快照，要么是 null）。
  const [pendingSelection, setPendingSelection] =
    useState<ReturnType<typeof readSelectionSnapshot>>(null)

  // useEffect 用来绑定 DOM 事件监听：只在组件挂载后执行一次（依赖数组 []）。
  useEffect(() => {
    // 取出当前 ref 指向的根容器 DOM；只有在挂载后它才会被赋值。
    const root = rootElement.current
    // 如果 root 为空（理论上极少发生），直接退出，不绑定事件。
    if (!root) return

    let rafId = 0

    const syncPendingSelection = () => {
      const snapshot = readSelectionSnapshot()
      const result = guardSelectionSnapshot(snapshot, root, {
        minLength: 1,
        disabledAttribute: 'data-comment-disabled',
      })
      setPendingSelection(result.ok ? result.snapshot : null)
    }

    // handleSelectionCommit 表示“用户完成一次选择”的回调：mouseup/touchend 时触发。
    const handleSelectionCommit = () => {
      syncPendingSelection()
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        rafId = 0
        syncPendingSelection()
      })
    }

    // 在 root 容器上监听 mouseup：桌面端用户松开鼠标时，表示一次选择完成。
    root.addEventListener('mouseup', handleSelectionCommit)
    // 在 root 容器上监听 touchend：移动端手指抬起时，表示一次选择完成。
    // passive: true 表示该监听不会调用 preventDefault，有利于滚动性能。
    root.addEventListener('touchend', handleSelectionCommit, { passive: true })

    // 返回清理函数：组件卸载或 effect 重新执行时，移除监听，避免内存泄漏与重复绑定。
    return () => {
      // 移除 mouseup 监听。
      root.removeEventListener('mouseup', handleSelectionCommit)
      // 移除 touchend 监听（注意：这里 removeEventListener 只需要同一个 handler 引用即可）。
      root.removeEventListener('touchend', handleSelectionCommit)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])
  // 空依赖数组表示：只在首次挂载执行一次，不会每次渲染都重复绑事件。

  // 渲染一个 div 作为 CommentScope 根容器，并把 ref 绑上以获得真实 DOM。
  return (
    <div ref={rootElement} data-commentable-has-selection={pendingSelection ? '1' : '0'}>
      {/* children 是被包裹的业务内容；CommentScope 不改变内容结构，只在外层增强能力 */}
      {children}
      {pendingSelection && (
        <FloatingCommentButton
          rect={pendingSelection.rect}
          direction={pendingSelection.direction}
          text={pendingSelection.text}
          range={pendingSelection.range}
        />
      )}
    </div>
  )
}
