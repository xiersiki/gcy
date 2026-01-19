// 定义一次“有效选区快照”的结构，供 UI 与后续锚点/高亮模块消费。
export interface SelectionSnapshot {
  // range 是原生 DOM Range，记录选区起止位置，用于后续序列化锚点与计算高亮。
  range: Range

  direction: 'forward' | 'backward'

  // text 是选区对应的纯文本（通常会 trim），用于最小长度判断与文本指纹（quote）记录。
  text: string

  // rect 是 UI 定位用的主矩形（这里选择最后一行 rect），用来放置“评论”按钮更自然。
  rect: DOMRect

  // clientRects 是选区的所有行矩形（多行选区会有多个），用于 overlay 高亮渲染。
  clientRects: DOMRect[]
}

// 读取当前 Selection 并将其标准化为 SelectionSnapshot；该函数只负责“读取与计算”，不做业务规则判定。
export function readSelectionSnapshot(
  // selection 支持注入，默认从 window.getSelection() 读取，便于测试或特殊场景替换。
  selection: Selection | null = window.getSelection(),
): SelectionSnapshot | null {
  // 没有 selection 或没有 range 时，表示当前不存在可用选区，直接返回 null。
  if (!selection || selection.rangeCount === 0) return null

  // isCollapsed 表示起点=终点（光标态），没有实际选中内容，直接返回 null。
  if (selection.isCollapsed) return null

  // 获取第一个 Range；常见浏览器/场景下用户一次选择对应一个 Range。
  const range = selection.getRangeAt(0)

  // 读取选区文本并 trim，避免纯空白选区影响体验。
  const text = selection.toString().trim()

  // 将多行选区拆成多段矩形，后续可用于高亮 overlay 或更精确的按钮定位。
  const rects = Array.from(range.getClientRects())

  // rects 为空代表选区不可见或无法计算坐标，无法定位 UI，因此返回 null。
  if (rects.length === 0) return null

  const direction = getSelectionDirection(selection)

  // 取最后一个 rect 作为主定位矩形，通常更贴近选区结束位置。
  const rect = rects[rects.length - 1]

  // 返回标准化快照，供 SelectionGuard 与 UI 层消费。
  return { range, direction, text, rect, clientRects: rects }
}

function getSelectionDirection(selection: Selection): 'forward' | 'backward' {
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection
  if (!anchorNode || !focusNode) return 'forward'

  if (anchorNode === focusNode) {
    return anchorOffset <= focusOffset ? 'forward' : 'backward'
  }

  const position = anchorNode.compareDocumentPosition(focusNode)
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return 'forward'
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 'backward'

  return 'forward'
}
