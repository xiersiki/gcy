// 引入 SelectionSnapshot 类型，用于描述 SelectionEngine 读取出来的选区快照结构。
import type { SelectionSnapshot } from './SelectionEngine'

// 定义校验失败的原因枚举，便于 UI 做精确响应（隐藏按钮/提示等）。
export type SelectionGuardReason =
  // 没有快照或没有选区。
  | 'empty'
  // 选区文本长度小于最小阈值。
  | 'too_short'
  // 选区不在 CommentScope 容器内（跨容器或不属于可评论区域）。
  | 'out_of_scope'
  // 选区命中了禁用区域（例如 data-comment-disabled 的节点内部）。
  | 'in_disabled_area'

// 定义校验结果：ok=true 时携带 snapshot，ok=false 时携带失败原因。
export type SelectionGuardResult =
  // 校验通过，返回可用的 snapshot。
  | { ok: true; snapshot: SelectionSnapshot }
  // 校验失败，返回原因。
  | { ok: false; reason: SelectionGuardReason }

// 定义校验可配置项，便于不同项目按需调整策略。
export interface SelectionGuardOptions {
  // 最小文本长度阈值；避免误选导致频繁弹出交互。
  minLength?: number
  // 禁用属性名；命中该属性的祖先节点表示该区域不可评论。
  disabledAttribute?: string
}

// 对 SelectionSnapshot 做规则校验：容器范围、最小长度、禁用区域等。
export function guardSelectionSnapshot(
  // snapshot 为 SelectionEngine 的输出；为 null 时代表当前没有可用选区。
  snapshot: SelectionSnapshot | null,
  // root 是 CommentScope 根容器，用于约束选区必须落在可评论范围内。
  root: HTMLElement,
  // options 提供最小长度、禁用属性等可配置项。
  options: SelectionGuardOptions = {},
): SelectionGuardResult {
  // snapshot 不存在，直接返回 empty。
  if (!snapshot) return { ok: false, reason: 'empty' }

  // 读取最小长度阈值；未设置时默认为 1。
  const minLength = options.minLength ?? 1
  // 读取禁用属性名；未设置时默认 data-comment-disabled。
  const disabledAttribute = options.disabledAttribute ?? 'data-comment-disabled'

  // 文本长度不足时直接判定失败，避免误触。
  if (snapshot.text.length < minLength) return { ok: false, reason: 'too_short' }

  // 将 Range 起点容器节点转换为 Element，用于 contains 判断。
  const startEl = nodeToElement(snapshot.range.startContainer)
  // 将 Range 终点容器节点转换为 Element，用于 contains 判断。
  const endEl = nodeToElement(snapshot.range.endContainer)
  // 任一端无法转换为 Element 时，无法可靠判断范围，按 out_of_scope 处理。
  if (!startEl || !endEl) return { ok: false, reason: 'out_of_scope' }
  // 起点或终点不在 root 内，说明选区跨出容器或不属于可评论区域。
  if (!root.contains(startEl) || !root.contains(endEl)) return { ok: false, reason: 'out_of_scope' }

  // 取共同祖先节点，辅助判断禁用区域覆盖（例如选区跨越多个子节点）。
  const commonEl = nodeToElement(snapshot.range.commonAncestorContainer)
  // 若起点、终点或共同祖先任一命中禁用祖先，则判定选区不可评论。
  if (
    hasDisabledAncestor(startEl, root, disabledAttribute) ||
    hasDisabledAncestor(endEl, root, disabledAttribute) ||
    (commonEl ? hasDisabledAncestor(commonEl, root, disabledAttribute) : false)
  ) {
    // 返回明确原因，UI 可用于提示或直接忽略该选区。
    return { ok: false, reason: 'in_disabled_area' }
  }

  // 所有规则通过，返回可用 snapshot。
  return { ok: true, snapshot }
}

// 将 Node 转换为 Element：若本身是 Element 则直接返回，否则返回其 parentElement。
function nodeToElement(node: Node): Element | null {
  // Text 节点常见于 Range 的 startContainer/endContainer，因此需要 parentElement 兜底。
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
}

// 判断某个元素是否存在带 attr 的祖先节点（在 root 边界内）；用于实现“禁用区域”规则。
function hasDisabledAncestor(element: Element, root: HTMLElement, attr: string): boolean {
  // current 从目标元素开始向上遍历。
  let current: Element | null = element
  // 一直遍历到 root（不包含 root 本身）或到达文档顶层。
  while (current && current !== root) {
    // 只要命中禁用属性，就认为该区域不可评论。
    if (current.hasAttribute(attr)) return true
    // 继续向上移动到父元素。
    current = current.parentElement
  }
  // 遍历结束仍未命中禁用属性，返回 false。
  return false
}
