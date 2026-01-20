export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { ApiErrorCode } from '@/server/api/errors'
import { getRequestId } from '@/server/api/request'
import { jsonError, jsonOk } from '@/server/api/response'
import { createGitHubClient, githubRequest } from '@/server/github/client'
import { completeIdea } from '@/use-cases/ideas/completeIdea'

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const body = (await req.json().catch(() => null)) as {
      ideaId?: unknown
      implementAuthorId?: unknown
      workType?: unknown
      title?: unknown
    } | null
    if (!body)
      return jsonError(ApiErrorCode.BadRequest, '缺少有效 payload', 400, {
        headers: { 'x-request-id': requestId },
      })

    let ghClient
    try {
      ghClient = createGitHubClient()
    } catch {
      return jsonError(ApiErrorCode.GitHubError, '缺少 GitHub 配置', 500, {
        headers: { 'x-request-id': requestId },
      })
    }

    const result = await completeIdea(
      {
        ideaId: String(body.ideaId ?? ''),
        implementAuthorId: String(body.implementAuthorId ?? ''),
        workType: body.workType === 'case-study' ? 'case-study' : 'demo',
        title: body.title ? String(body.title) : undefined,
      },
      { ghClient, githubRequest, now: () => new Date() },
    )
    if (!result.ok)
      return jsonError(result.error.code, result.error.message, result.error.status, {
        headers: { 'x-request-id': requestId },
      })
    return jsonOk(result.data, { headers: { 'x-request-id': requestId } })
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建失败'
    const status = message.includes('无效的') || message.includes('缺少有效 payload') ? 400 : 500
    return jsonError(ApiErrorCode.BadRequest, message, status, {
      headers: { 'x-request-id': requestId },
    })
  }
}
