export const ApiErrorCode = {
  Unauthorized: 'UNAUTHORIZED',
  BadRequest: 'BAD_REQUEST',
  NotFound: 'NOT_FOUND',
  RateLimited: 'RATE_LIMITED',
  SupabaseNotConfigured: 'SUPABASE_NOT_CONFIGURED',
  SupabaseError: 'SUPABASE_ERROR',
  GitHubError: 'GITHUB_ERROR',
  Conflict: 'CONFLICT',
} as const

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode]
