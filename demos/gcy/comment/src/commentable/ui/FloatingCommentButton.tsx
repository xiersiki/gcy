import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react'
import { Button } from '@arco-design/web-react'
import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

export type FloatingCommentButtonProps = {
  rect: DOMRect
  direction?: 'forward' | 'backward'
  text: string
  range?: Range
  onClick?: (ctx: { rect: DOMRect; text: string; range?: Range }) => void
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
  getClientRects?: () => ClientRectLike[]
  contextElement?: Element
}

export default function FloatingCommentButton({
  rect,
  direction = 'forward',
  text,
  range,
  onClick,
}: FloatingCommentButtonProps) {
  const floatingElementRef = useRef<HTMLElement | null>(null)

  const virtualReference = useMemo<VirtualReference>(() => {
    const contextElement = nodeToElement(range?.commonAncestorContainer)

    const computeRect = (): ClientRectLike => {
      if (range) {
        const rects = Array.from(range.getClientRects())
        const picked = direction === 'backward' ? rects[0] : rects[rects.length - 1]
        if (picked) return toClientRectLike(picked)
      }
      return toClientRectLike(rect)
    }

    return {
      contextElement: contextElement ?? undefined,
      getBoundingClientRect: computeRect,
      getClientRects: () => [computeRect()],
    }
  }, [direction, rect, range])

  const { refs, floatingStyles, update } = useFloating({
    strategy: 'fixed',
    placement: direction === 'backward' ? 'top' : 'bottom',
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  useEffect(() => {
    refs.setReference(virtualReference)
    refs.setFloating(floatingElementRef.current)
    update()

    return () => {
      refs.setFloating(null)
    }
  }, [refs, update, virtualReference])

  return createPortal(
    <Button
      ref={(node) => {
        floatingElementRef.current = node as unknown as HTMLElement | null
      }}
      htmlType="button"
      type="text"
      size="small"
      shape="round"
      style={{
        ...floatingStyles,
        zIndex: 1000,
        pointerEvents: 'auto',
        background: 'rgba(255,255,255,0.96)',
        color: 'rgba(55,53,47,0.86)',
        border: '1px solid rgba(15,15,15,0.12)',
        boxShadow: '0 8px 24px rgba(15,15,15,0.12)',
        height: 32,
        padding: '0 12px',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: '32px',
        borderRadius: 999,
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
      }}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick?.({ rect, text, range })
      }}
      aria-label="添加评论"
    >
      评论
    </Button>,
    document.body,
  )
}

function toClientRectLike(rect: DOMRect | DOMRectReadOnly): ClientRectLike {
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

function nodeToElement(node: Node | undefined | null): Element | null {
  if (!node) return null
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
}
