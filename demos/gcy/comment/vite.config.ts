// 从 Vite 引入 defineConfig，用于获得更好的类型提示与配置结构约束。
import { defineConfig } from 'vite'
// 引入 React 插件，让 Vite 支持 JSX/TSX 与 React Fast Refresh。
import react from '@vitejs/plugin-react'

// 导出 Vite 配置：该配置仅用于 demos/gcy/comment 这个独立的 Vite 应用。
export default defineConfig({
  // 启用 React 插件。
  plugins: [react()],
  // base 使用相对路径，便于 demo 以静态文件方式部署或被 iframe 引用。
  base: './',
})
