# 主路径优化基线（2026-02-25）

## 质量门禁基线

- `pnpm format:check`: pass
- `pnpm lint`: pass
- `pnpm typecheck`: pass
- `pnpm test:ci`: pass
- `pnpm build`: pass

## 构建与产物基线

- Next.js: `15.4.10`
- 主路径页面：
  - `/works`: 首屏 JS 约 `145 kB`
  - `/works/[authorId]/[slug]`: 首屏 JS 约 `146 kB`
- `demos/gcy/comment`:
  - JS 产物约 `294 kB`（gzip `94 kB`）
  - CSS 产物约 `570 kB`（gzip `64 kB`）

## 主路径手测清单（基线）

- 作品列表：
  - 分类/精选/难度筛选与重置
  - 空状态与恢复动作
- 作品详情：
  - 预览/文档/评论切换
  - 点赞/收藏登录态与未登录跳转
- 评论：
  - 首屏加载、加载更多、发送与失败回滚
  - `Ctrl/Cmd + Enter` 提交
- 登录回流：
  - 未登录操作后跳转登录并返回来源页面

## 已知风险

- 本地 Node 版本仍可能低于项目 `>=20` 要求，建议统一 Node 20。
- 评论与互动 API 对网络抖动敏感，需要持续观察失败率与重试成功率。
