# 贡献规范

## 贡献流程

1. Fork 仓库并创建分支
2. 开发与自测
3. 提交 PR

## 提交信息规范

使用 Conventional Commits：

```
<type>(optional scope): <subject>
```

常见 type：

- feat：新增功能
- fix：修复问题
- docs：文档变更
- refactor：重构（不新增功能不修 bug）
- chore：工程化/依赖/构建配置
- test：测试相关

示例：

```
feat: 添加作品详情页
fix: 修复图片懒加载闪烁
chore: 调整 CI 流程
```

## 代码风格

- 代码格式化：Prettier
- 代码校验：ESLint
- 提交前自动校验：lint-staged + husky

## 提交前检查（建议）

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:ci
```
