# 质量门禁规范

## 本地提交前

按顺序执行：

1. `pnpm format:check`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test:ci`
5. `pnpm build`

## CI 顺序（强制）

`format:check -> lint -> typecheck -> test:ci -> build`

## 变更影响最小验证

- 仅样式改动：至少执行 `format:check`, `lint`, `test:ci`
- 仅内容改动：至少执行 `content:validate`, `typecheck`, `build`
- API / hooks 改动：必须执行全量门禁

## 产物预算（非阻塞告警）

- 执行：`pnpm bundle:check`
- 默认仅告警不阻塞构建
- 当 `BUNDLE_BUDGET_STRICT=1` 时超限返回非 0
