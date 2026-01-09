# 个人作品集合（Portfolio）

基于 React + TypeScript + Vite 的个人作品集合站点，已内置工程化配置（质量控制、提交规范、测试、CI/CD），用于后续快速迭代。

## 技术栈

- Vite + React + TypeScript
- ESLint + Prettier
- Husky + lint-staged + commitlint（Conventional Commits）
- Vitest + Testing Library
- GitHub Actions：CI + GitHub Pages 部署

## 快速开始

```bash
pnpm install
pnpm dev
```

## 常用脚本

- 开发：`pnpm dev`
- 构建：`pnpm build`
- 预览：`pnpm preview`
- 类型检查：`pnpm typecheck`
- ESLint：`pnpm lint` / `pnpm lint:fix`
- Prettier：`pnpm format` / `pnpm format:check`
- 测试：`pnpm test` / `pnpm test:ci` / `pnpm coverage`

## 目录结构（约定）

```
src/
  app/                 应用入口与路由/Provider（后续扩展）
  pages/               页面级模块
  styles/              全局样式
  test/                测试初始化与工具
```

## 提交规范

采用 Conventional Commits，提交会在本地被 commitlint 校验。

示例：

```
feat: 添加作品列表页面
fix: 修复移动端布局错位
chore: 升级依赖
```

## CI/CD

- CI：在 PR / push(main) 时执行 format、lint、typecheck、test、build
- Pages：push(main) 自动构建并发布到 GitHub Pages

本项目已在 [vite.config.ts](file:///Users/bytedance/code/gcy/vite.config.ts) 支持 `BASE_PATH`，用于 GitHub Pages 的子路径部署。
