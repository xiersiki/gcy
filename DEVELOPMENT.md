# 开发指南

## 环境要求

- Node.js 24
- pnpm 10+

## 本地开发

```bash
pnpm install
pnpm dev
```

## 质量控制

```bash
pnpm format:check
pnpm lint
pnpm typecheck
```

## 测试

```bash
pnpm test
pnpm test:ci
pnpm coverage
```

## 构建与预览

```bash
pnpm build
pnpm start
```

## 产物目录

- `pnpm build` 会生成 Next.js SSR 产物（`.next/`）
- `pnpm run build:prepare` 会生成内容索引与 demos 静态产物（同步到 `public/demos/`，并写入 `public/demos/manifest.json`）
- Cloudflare 生产部署使用 Workers（OpenNext 产物目录为 `.open-next/`，由 `pnpm run build:cloudflare` 生成）

## Cloudflare（Workers）本地预览

```bash
pnpm preview:cloudflare
```
