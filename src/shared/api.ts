export type ApiError = {
  code: string
  message: string
}

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiError }

export type UserFacingErrorCode =
  | 'auth_required'
  | 'rate_limited'
  | 'not_found'
  | 'conflict'
  | 'bad_request'
  | 'service_unavailable'
  | 'unknown'

export function mapApiErrorCode(code?: string): UserFacingErrorCode {
  switch (code) {
    case 'UNAUTHORIZED':
      return 'auth_required'
    case 'RATE_LIMITED':
      return 'rate_limited'
    case 'NOT_FOUND':
      return 'not_found'
    case 'CONFLICT':
      return 'conflict'
    case 'BAD_REQUEST':
      return 'bad_request'
    case 'SUPABASE_ERROR':
    case 'GITHUB_ERROR':
    case 'SUPABASE_NOT_CONFIGURED':
      return 'service_unavailable'
    default:
      return 'unknown'
  }
}

export function toUserFacingMessage(code: UserFacingErrorCode): string {
  switch (code) {
    case 'auth_required':
      return '请先登录后再操作'
    case 'rate_limited':
      return '操作过于频繁，请稍后再试'
    case 'not_found':
      return '资源不存在或已被移除'
    case 'conflict':
      return '当前状态已变化，请刷新后重试'
    case 'bad_request':
      return '请求参数不正确，请检查后重试'
    case 'service_unavailable':
      return '服务暂时不可用，请稍后再试'
    default:
      return '请求失败，请稍后再试'
  }
}

export class ApiRequestError extends Error {
  status: number
  code?: string
  userCode: UserFacingErrorCode

  constructor(
    message: string,
    options: { status: number; code?: string; userCode?: UserFacingErrorCode },
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = options.status
    this.code = options.code
    this.userCode = options.userCode ?? mapApiErrorCode(options.code)
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError
}

export async function readApiData<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    let parsed: ApiResponse<T> | null = null
    try {
      parsed = JSON.parse(raw) as ApiResponse<T>
    } catch {
      parsed = null
    }
    if (parsed && 'ok' in parsed && parsed.ok === false) {
      const code = mapApiErrorCode(parsed.error?.code)
      throw new ApiRequestError(toUserFacingMessage(code), {
        status: res.status,
        code: parsed.error?.code,
        userCode: code,
      })
    }
    throw new ApiRequestError(raw || `Request failed (${res.status})`, {
      status: res.status,
      userCode: 'unknown',
    })
  }
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null
  if (!json)
    throw new ApiRequestError('Invalid response', {
      status: res.status,
      userCode: 'unknown',
    })
  if (json.ok !== true)
    throw new ApiRequestError(json.error?.message || 'Request failed', {
      status: res.status,
      code: json.error?.code,
    })
  return json.data
}

export async function requestApiData<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  return readApiData<T>(res)
}
