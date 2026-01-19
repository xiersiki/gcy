import { CommentScope } from '../../commentable'

export default function ArticleExample() {
  return (
    <CommentScope>
      <article
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '24px 16px 120px',
          fontSize: 16,
          lineHeight: 1.75,
          color: '#111827',
        }}
      >
        <h1 style={{ fontSize: 28, lineHeight: 1.2, margin: '0 0 16px' }}>
          长文章示例（划词评论）
        </h1>

        <p style={{ margin: '0 0 12px' }}>
          这是一个用于演示的长文章内容。你可以在任意段落中选中一段文本，松开鼠标后会在选区旁出现“评论”按钮。
        </p>

        <p style={{ margin: '0 0 12px' }}>
          这个按钮的定位锚点来自浏览器原生 Selection（range 的 client
          rects），因此即使选区跨行，也能更自然地贴近最后一行。
        </p>

        <h2 style={{ fontSize: 20, lineHeight: 1.3, margin: '24px 0 12px' }}>列表</h2>
        <ul style={{ margin: '0 0 12px', paddingLeft: 22 }}>
          <li>选中列表项中的任意文字。</li>
          <li>尝试在段落末尾选中几个字。</li>
          <li>试试跨行选择：从这一行开始，拖到下一段的一部分。</li>
        </ul>

        <h2 style={{ fontSize: 20, lineHeight: 1.3, margin: '24px 0 12px' }}>引用</h2>
        <blockquote
          style={{
            margin: '0 0 12px',
            padding: '10px 12px',
            borderLeft: '4px solid rgba(17,24,39,0.2)',
            background: 'rgba(17,24,39,0.04)',
            borderRadius: 8,
          }}
        >
          选中这里的文字也应该出现按钮。引用块常常靠近边缘，更容易触发 flip / shift 的避障效果。
        </blockquote>

        <h2 style={{ fontSize: 20, lineHeight: 1.3, margin: '24px 0 12px' }}>禁用区域</h2>
        <p style={{ margin: '0 0 12px' }}>
          下面这段被标记为不可评论：
          <span
            data-comment-disabled
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              marginLeft: 6,
              borderRadius: 6,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#991b1b',
            }}
          >
            这里的文字不应该弹出评论入口
          </span>
          。
        </p>

        <p style={{ margin: '0 0 12px' }}>
          为了更接近真实文章排版，再加一段稍长的文本：在信息密度高的页面里，选区按钮需要尽量不遮挡正文，并在靠近视口边缘时自动翻转到可见位置。
        </p>
      </article>
    </CommentScope>
  )
}
