# 主路径指标看板（轻量版）

## 前端体验指标

- LCP（首页、作品列表、作品详情）
- INP（筛选切换、Tab 切换、评论提交）
- CLS（详情页头部与评论区）
- 客户端错误数（按路由聚合）

## API 稳定性指标

- `4xx/5xx` 比例（按接口聚合）
- `401` 触发后登录回流成功率
- 评论发送失败率
- 点赞/收藏失败率

## 采集建议

- 在关键操作埋点（筛选、切 tab、评论提交、点赞、收藏）
- 所有 API 响应携带 `x-request-id`，便于日志串联
- 统计周期按天汇总，周维度复盘趋势

## 看板字段约定

- `route`: 页面路径（如 `/works`, `/works/[authorId]/[slug]`）
- `action`: 交互动作（`filter_change`, `tab_change`, `comment_submit`）
- `status`: `success | failed | canceled`
- `duration_ms`: 操作总耗时
- `request_id`: 接口请求关联 ID
