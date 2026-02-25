# API 错误契约

## 统一响应结构

成功：

```json
{ "ok": true, "data": {} }
```

失败：

```json
{ "ok": false, "error": { "code": "BAD_REQUEST", "message": "..." } }
```

## 标准错误码

- `UNAUTHORIZED` (401)
- `BAD_REQUEST` (400)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `RATE_LIMITED` (429)
- `SUPABASE_NOT_CONFIGURED` (500)
- `SUPABASE_ERROR` (500)
- `GITHUB_ERROR` (500)

## 前端用户态映射

- `UNAUTHORIZED` -> `auth_required`
- `RATE_LIMITED` -> `rate_limited`
- `NOT_FOUND` -> `not_found`
- `CONFLICT` -> `conflict`
- `BAD_REQUEST` -> `bad_request`
- `SUPABASE_* / GITHUB_ERROR` -> `service_unavailable`
- 其他 -> `unknown`
