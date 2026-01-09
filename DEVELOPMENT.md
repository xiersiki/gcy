# 开发指南

## 环境要求

- Node.js 18+（建议 20+）
- npm 10+

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

## GitHub Pages 部署路径

GitHub Pages 会部署到 `/<repo>/` 子路径，构建时通过 `BASE_PATH` 注入：

```bash
BASE_PATH="/my-repo/" pnpm build
```
