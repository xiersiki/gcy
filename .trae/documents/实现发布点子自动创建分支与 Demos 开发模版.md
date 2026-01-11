## 原则

- 开发模式与生产模式采用完全一致的代码路径：仅使用 GitHub REST API 远端创建分支与提交文件，并创建 PR；不引入“本地落盘/child_process”的分支逻辑。

## 配置差异（而非代码差异）

- 使用环境变量切换目标仓库：
  - `GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_TOKEN`：开发环境指向沙箱仓库；生产环境指向正式仓库。
- 其余逻辑与数据结构完全一致（meta、mdx、assets、demos 模版）。

## 路由实现（单一逻辑）

- `POST /api/ideas`：
  1. 校验并生成 `slug` 与分支名 `ideas/{authorId}/{slug}`。
  2. 读取 base 分支最新 SHA。
  3. 以 `POST /git/blobs` + `POST /git/trees` 组装新增文件：
     - `content/works/{author}/{slug}/meta.yml`
     - `content/works/{author}/{slug}/index.mdx`
     - `content/works/{author}/{slug}/assets/*`（图片转 blob + 引用）
     - `demos/{author}/{slug}/`（`package.json`、`vite.config.js`、`index.html`、`main.js`）
  4. `POST /git/commits` 创建提交；`POST /git/refs` 创建分支。
  5. `POST /pulls` 创建 PR，并返回 `prUrl`。
- 出错即返回 4xx/5xx 与错误信息；不执行任何本地写入。

## 验证与联调

- 开发环境：设置沙箱仓库令牌后，实际在 GitHub 上创建分支与 PR；拉取分支本地运行 `pnpm dev:work -- author/slug` 验证 Demo。
- 生产环境：同样逻辑运行于 Cloudflare，创建正式 PR；合并后主站包含新作品。

## 安全

- 令牌仅来自环境（Cloudflare Secrets / 本地未提交的 .env）；不入库。
- 严格校验文件名/路径与图片大小/数量/MIME。

如确认采用“单一 GitHub API 逻辑”的方案，我将开始实现路由与 GitHub API 接入，并完成联调与验证。
