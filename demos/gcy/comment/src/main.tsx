// 从 react-dom/client 引入 createRoot，用于创建 React 19 的根节点。
import { createRoot } from 'react-dom/client'
import '@arco-design/web-react/dist/css/arco.css'
// 引入 demo 展示层 App（位于 src/app/App.tsx）。
import App from './app/App'
// 引入 demo 全局样式（目前为空，后续可放演示页面样式）。
import './styles.css'

// 找到 HTML 中的 #root 容器并创建 React Root（! 表示我们确信它存在）。
createRoot(document.querySelector('#root')!).render(<App />)
