import { describe, expect, it } from 'vitest'

import { mapApiErrorCode, toUserFacingMessage } from '@/shared/api'

describe('API error mapping', () => {
  it('maps backend error codes into user-facing codes', () => {
    expect(mapApiErrorCode('UNAUTHORIZED')).toBe('auth_required')
    expect(mapApiErrorCode('RATE_LIMITED')).toBe('rate_limited')
    expect(mapApiErrorCode('BAD_REQUEST')).toBe('bad_request')
    expect(mapApiErrorCode('SUPABASE_ERROR')).toBe('service_unavailable')
    expect(mapApiErrorCode('UNKNOWN')).toBe('unknown')
  })

  it('returns readable messages for user-facing codes', () => {
    expect(toUserFacingMessage('auth_required')).toContain('登录')
    expect(toUserFacingMessage('unknown')).toContain('请求失败')
  })
})
