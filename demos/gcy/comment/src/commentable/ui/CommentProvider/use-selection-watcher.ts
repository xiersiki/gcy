import { RefObject, useEffect, useState } from 'react'
import { readSelectionSnapshot, SelectionSnapshot } from '../../core/selection/SelectionEngine'
import { guardSelectionSnapshot } from '../../core/selection/SelectionGuard'
interface UseSelectionWatcherProps {
  rootElement: RefObject<HTMLDivElement | null>
}
interface UseSelectionWatcherResult {
  pendingSelection: SelectionSnapshot | null
}
export function useSelectionWatcher({
  rootElement,
}: UseSelectionWatcherProps): UseSelectionWatcherResult {
  // 该 hook 用于监听选区变化，触发评论按钮的显示与隐藏。
  // pendingSelection 用来存“当前有效选区快照”，有值时未来会显示幽灵按钮/打开抽屉。
  // 类型使用 ReturnType<typeof readSelectionSnapshot>，确保与引擎输出保持一致（要么是快照，要么是 null）。
  const [pendingSelection, setPendingSelection] =
    useState<ReturnType<typeof readSelectionSnapshot>>(null)
  // useEffect 用来绑定 DOM 事件监听：只在组件挂载后执行一次（依赖数组 []）。
  // 空依赖数组表示：只在首次挂载执行一次，不会每次渲染都重复绑事件。
  useEffect(() => {
    // 取出当前 ref 指向的根容器 DOM；只有在挂载后它才会被赋值。
    const root = rootElement?.current
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
  }, [rootElement])
  return { pendingSelection }
}
