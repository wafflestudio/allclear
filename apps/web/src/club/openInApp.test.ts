import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openAppDeepLink } from './openInApp'

describe('openAppDeepLink', () => {
  const addEventListener = vi.fn()
  const removeEventListener = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('window', { location: { href: '' } })
    vi.stubGlobal('document', {
      hidden: false,
      addEventListener,
      removeEventListener,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('fallback을 끄면 앱 실행 실패 후에도 스토어로 자동 이동하지 않는다', () => {
    openAppDeepLink('manager-transfer/example-token', { fallbackUrl: null })

    expect(window.location.href).toBe('allclear://manager-transfer/example-token')
    vi.advanceTimersByTime(3000)
    expect(window.location.href).toBe('allclear://manager-transfer/example-token')
  })

  it('기존 호출은 다운로드 안내 페이지 fallback을 유지한다', () => {
    openAppDeepLink('club/example-club')

    vi.advanceTimersByTime(1500)
    expect(window.location.href).toBe('/download/app')
  })
})
