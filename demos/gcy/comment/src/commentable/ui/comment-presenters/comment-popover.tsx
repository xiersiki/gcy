import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { FC, useLayoutEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { SelectionSnapshot } from '../../core/selection/SelectionEngine'
import CommentPanel from '../comment-panel/CommentPanel'
import styles from './comment-popover.module.css'

export interface CommentPopoverProps {
  selection: SelectionSnapshot
  visible: boolean
  onClose: () => void
  onSubmit: (text: string) => void
}
type ClientRectLike = {
  x: number
  y: number
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}
type VirtualReference = {
  getBoundingClientRect: () => ClientRectLike
}
function toClientRectLike(rect: DOMRect): ClientRectLike {
  return {
    x: rect.x,
    y: rect.y,
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  }
}
const CommentPopover: FC<CommentPopoverProps> = ({
  selection,
  visible,
  onClose,
  onSubmit,
}: CommentPopoverProps) => {
  const floatingElementRef = useRef<HTMLElement | null>(null)
  const virtualReference: VirtualReference = useMemo(
    () => ({
      getBoundingClientRect: () => toClientRectLike(selection.rect),
    }),
    [selection.rect],
  )
  const { refs, floatingStyles, update, context } = useFloating({
    placement: 'right-start',
    middleware: [offset(12), flip(), shift({ padding: 12 })],
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    open: visible,
    onOpenChange: (nextOpen) => {
      if (!nextOpen) onClose()
    },
  })
  const dismiss = useDismiss(context, {
    escapeKey: true,
    outsidePress: true,
  })
  const role = useRole(context, { role: 'dialog' })
  const { getFloatingProps } = useInteractions([dismiss, role])

  useLayoutEffect(() => {
    refs.setReference(virtualReference)
    refs.setFloating(floatingElementRef.current)
    update()
    return () => {
      refs.setFloating(null)
      refs.setReference(null)
    }
  }, [refs, update, virtualReference])

  if (!visible) return null

  return createPortal(
    <div
      ref={(node) => {
        floatingElementRef.current = node as unknown as HTMLElement | null
      }}
      className={styles.popover}
      style={floatingStyles}
      {...getFloatingProps()}
      aria-label="评论面板"
    >
      <CommentPanel selection={selection} onSubmit={onSubmit} />
    </div>,
    document.body,
  )
}
export default CommentPopover
