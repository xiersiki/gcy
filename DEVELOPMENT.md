# 开发指南

## 环境要求

- Node.js 18+（建议 20+）
- pnpm 10+

## 本地开发

```bash
pnpm install
pnpm dev
```

## 常见问题

### dev 模式报错：ENOENT edge-runtime-webpack.js

现象：启动后访问页面出现 `ENOENT: no such file or directory, open '.next/server/edge-runtime-webpack.js'`。

处理：

1. 停止 `pnpm dev`
2. 删除 `.next/`
3. 重新执行 `pnpm dev`

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
