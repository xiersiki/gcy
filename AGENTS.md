# AGENTS.md

本文件为 AI coding agents 提供稳定的项目上下文与工作指引，帮助在本仓库内高效、可控地完成开发任务。

## 项目概览

- 目标：个人作品集合（Portfolio）站点
- 技术栈：Next.js（App Router）+ React + TypeScript
- 内容：YAML（元信息）+ MDX（正文）+ demos（独立交互）
- 包管理：pnpm（见 package.json 的 packageManager 字段）
- 质量：ESLint + Prettier
- 提交规范：Husky + lint-staged + commitlint（Conventional Commits）
- 测试：Vitest + Testing Library
- CI/CD：GitHub Actions（CI + GitHub Pages）

## 开发环境

- Node.js：建议 20+（本地 Node 18+ 也可）
- pnpm：10+

安装依赖：

```bash
pnpm install
```

启动开发：

```bash
pnpm dev
```

## 常用命令

- 格式检查：`pnpm format:check`
- 格式修复：`pnpm format`
- Lint：`pnpm lint` / `pnpm lint:fix`
- 类型检查：`pnpm typecheck`
- 测试（交互）：`pnpm test`
- 测试（CI）：`pnpm test:ci`
- 覆盖率：`pnpm coverage`
- 构建：`pnpm build`
- 预览：`pnpm preview`（需先 `pnpm build`）
- 联调某作品：`pnpm dev:work -- <authorId>/<slug>`
- 内容校验：`pnpm content:validate`

如果 pnpm 提示某些依赖的 build scripts 被忽略，按需执行：

```bash
pnpm approve-builds
```

## 目录约定

```
content/               作者/作品内容（YAML + MDX）
demos/                 每个作品的独立交互 demo（各自依赖）
scripts/               构建、校验与本地工具脚本
src/
  app/                 Next.js App Router 页面
  components/           通用组件（含 demo iframe 容器）
  features/             页面级模块/复用区块
  content/              内容类型定义
  generated/            content:build 生成物
  test/                 测试初始化与工具
```

新增代码优先遵循现有结构与命名方式，避免引入与当前体量不匹配的复杂架构。

## 代码与工程约束

- 默认遵循现有 ESLint/Prettier 配置，不要引入新的格式化体系
- 不要引入未在仓库中使用的重型框架或状态管理库，除非有明确收益
- 变更应包含相应测试，且保证 CI 所有步骤可通过

## 测试与验证要求

在提交前，至少跑通：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:ci
pnpm build
```

## GitHub Pages 部署说明

- Pages 部署在 `/<repo>/` 子路径
- 构建时通过 `BASE_PATH` 注入（详见 vite.config.ts）

```bash
BASE_PATH="/my-repo/" pnpm build
```

## PR 与提交信息

- 提交信息：Conventional Commits（例如 `feat: xxx` / `fix: xxx` / `chore: xxx`）
- 提交前会运行 lint-staged（pre-commit）与 commitlint（commit-msg），不要绕过 hooks
