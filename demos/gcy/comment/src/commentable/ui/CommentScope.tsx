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

    // handleSelectionCommit 表示“用户完成一次选择”的回调：mouseup/touchend 时触发。
    const handleSelectionCommit = () => {
      // 读取当前的选区快照：包含 range/text/rect/clientRects。
      const snapshot = readSelectionSnapshot()

      // 对快照做规则校验：必须在 root 内、长度够、且不在禁用区域。
      const result = guardSelectionSnapshot(snapshot, root, {
        // 最小长度阈值：少于 1 个字符就不算有效选区。
        minLength: 1,
        // 禁用属性名：如果选区落在带该属性的祖先节点内，则不可评论。
        disabledAttribute: 'data-comment-disabled',
      })

      // 如果校验通过，就把有效快照写入 state，后续 UI 会据此显示按钮/抽屉。
      if (result.ok) {
        // 保存有效选区快照。
        setPendingSelection(result.snapshot)
        // 结束本次处理，避免继续走到“清空”逻辑。
        return
      }

      // 校验不通过：清空 pendingSelection，确保 UI 不显示按钮/抽屉入口。
      setPendingSelection(null)
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
