// demo 根组件：用于展示 commentable 模块的接入效果。
import ArticleExample from './app/demoContent/ArticleExample'
export default function App() {
  // 目前仅做占位渲染，后续会在这里包裹 <CommentScope> 并渲染示例内容。
  return (
    // wrap 类名用于控制 demo 页面布局与宽度。
    <div className="wrap">
      <ArticleExample />
    </div>
  )
}
