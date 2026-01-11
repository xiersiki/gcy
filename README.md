# 作品集合（Portfolio）

一个内容驱动的作品/点子展示站：作者与作品以内容包（YAML + MDX）形式提交，构建期生成索引供 Next.js 页面消费，适合多人通过 PR 协作维护。

## 技术栈

- Next.js（App Router）+ React + TypeScript
- MDX（作品正文）+ YAML（作者/作品元信息）
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

- 开发：`pnpm dev`（会先运行 `content:build` 生成内容索引）
- 联调某个作品：`pnpm dev:work -- <authorId>/<slug>`（同时启动主站 + 对应 demo）
- 构建：`pnpm build`（会先运行 `content:build` 再进行 Next.js 构建）
- 预览构建产物：`pnpm preview`（需先 `pnpm build`）
- 生产启动：`pnpm start`
- 类型检查：`pnpm typecheck`
- ESLint：`pnpm lint` / `pnpm lint:fix`
- Prettier：`pnpm format` / `pnpm format:check`
- 测试：`pnpm test` / `pnpm test:ci` / `pnpm coverage`
- 内容索引生成：`pnpm content:build`
- 内容校验：`pnpm content:validate`
- 构建所有 demos：`pnpm demos:build`

## 目录结构（约定）

```
content/
  authors/<authorId>/profile.yml           作者资料
  works/<authorId>/<slug>/
    meta.yml                               作品元信息
    index.mdx                              作品正文（MDX）
demos/
  <authorId>/<slug>/                       独立交互 demo（各自依赖与构建）
scripts/
  content/
    build.mjs                              构建期扫描内容并生成索引
    validate.mjs                           校验 YAML schema
  dev/
    work.mjs                               同时启动主站 + 指定 demo
  build/
    assemble-dist.mjs                      聚合主站与 demos 到 dist/
src/
  app/                                    Next.js App Router 页面
  components/                              通用组件（含 demo iframe 容器）
  features/                                可复用的展示组件/页面模块
  content/                                 TypeScript 内容类型定义
  generated/                               由 content:build 生成的内容索引（不要手改）
  test/                                    测试初始化与工具
```

## 如何新增内容（多人协作）

1. 新增作者：
   - 新建 `content/authors/<authorId>/profile.yml`
   - `profile.yml` 内的 `id` 必须等于目录名 `<authorId>`
2. 新增作品：
   - 新建 `content/works/<authorId>/<slug>/meta.yml`
   - 新建 `content/works/<authorId>/<slug>/index.mdx`
3. 本地验证：
   - `pnpm content:validate` 校验 YAML schema
   - `pnpm dev` 或 `pnpm build` 会自动运行 `content:build` 生成索引

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
