export type FloatingCommentButtonProps = {
  rect: DOMRect
  text: string
  range?: Range
}
export default function FloatingCommentButton({ rect, text, range }: FloatingCommentButtonProps) {
  // 该组件用于渲染选区旁的“评论”入口按钮（未来会接入 Floating UI 做智能翻转与避障）。

  return { rect, text, range }
}
