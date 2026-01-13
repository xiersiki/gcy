# Commit Message Policy (Trae)

生成提交信息时必须遵循 Conventional Commits，并满足以下约束：

1. 仅输出提交信息本身（不要代码块、不要解释、不要前后缀文本）。

2. Header（必填，单行）格式：

`<type>(<scope>): <subject>`

- type 只能使用：`feat` `fix` `docs` `chore` `refactor` `test` `build` `ci` `perf` `revert`
- scope 使用与变更模块对应的短词，例如：`commentable` `comment` `content` `scripts` `deps` `build`
- subject 用一句话概括变更，不要堆砌列表

3. Body（可选，多行）格式：

- 使用 `- ` 开头的条目列出关键改动（建议 2~5 条）
- 每条描述“做了什么 + 影响/结果”，避免空泛

4. 示例：

feat(comment): 新增划词评论功能基础框架与示例

- 初始化 commentable 核心模块：选区引擎、校验规则、状态管理、UI 组件
- 添加示例作品，演示评论功能接入方式

chore(deps): bump next to patched version
