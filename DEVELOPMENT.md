# 开发指南

## 环境要求

- Node.js 18+（建议 20+）
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
pnpm preview
```

## 产物目录

- `pnpm build` 会生成 `out/`（Next.js export）并聚合成最终部署目录 `dist/`
- Cloudflare Pages 输出目录指向 `dist/`
