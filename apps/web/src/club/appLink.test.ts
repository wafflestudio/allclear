import { describe, expect, it } from 'vitest'
import {
  buildAndroidIntentUrl,
  buildSchemeUrl,
  detectMobilePlatform,
  isAppBannerPath,
  toAppDeepPath,
  toPathname,
} from './appLink'

const UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

describe('detectMobilePlatform', () => {
  it.each([
    [
      'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
      'android',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      'ios',
    ],
    ['Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', 'ios'],
  ])('%s → %s', (userAgent, expected) => {
    expect(detectMobilePlatform(userAgent)).toBe(expected)
  })

  it('데스크톱 브라우저는 감지하지 않는다', () => {
    expect(
      detectMobilePlatform(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
      ),
    ).toBeNull()
  })
})

describe('toPathname', () => {
  it.each([
    [`/club/${UUID}`, `/club/${UUID}`],
    [`/club/${UUID}?tab=recruit`, `/club/${UUID}`],
    ['/club/search#top', '/club/search'],
  ])('%s → %s', (url, expected) => {
    expect(toPathname(url)).toBe(expected)
  })
})

describe('toAppDeepPath', () => {
  it('동아리 상세는 앱의 상세 화면으로 연결한다', () => {
    expect(toAppDeepPath(`/club/${UUID}`)).toBe(`club/${UUID}`)
  })

  it('동아리 상세 하위 경로도 상세 화면으로 연결한다', () => {
    expect(toAppDeepPath(`/club/${UUID}/review`)).toBe(`club/${UUID}`)
  })

  it.each(['/club', '/club/search', '/club/saved', '/club/mypage', '/club/category/운동'])(
    '앱에 대응 딥링크가 없는 %s는 앱 첫 화면으로 보낸다',
    (pathname) => {
      expect(toAppDeepPath(pathname)).toBe('')
    },
  )
})

describe('buildSchemeUrl', () => {
  it.each([
    [`club/${UUID}`, `allclear://club/${UUID}`],
    ['', 'allclear://'],
  ])('%s → %s', (deepPath, expected) => {
    expect(buildSchemeUrl(deepPath)).toBe(expected)
  })
})

describe('buildAndroidIntentUrl', () => {
  it('폴백 URL을 인코딩해 intent 파라미터로 넣는다', () => {
    expect(buildAndroidIntentUrl(`club/${UUID}`, 'https://all-clear.cc/download/app')).toBe(
      `intent://club/${UUID}#Intent;scheme=allclear;S.browser_fallback_url=https%3A%2F%2Fall-clear.cc%2Fdownload%2Fapp;end`,
    )
  })
})

describe('isAppBannerPath', () => {
  it.each(['/club', `/club/${UUID}`, '/club/search', '/club/mypage'])('%s에서는 노출한다', (p) => {
    expect(isAppBannerPath(p)).toBe(true)
  })

  it.each([
    '/club/auth/callback',
    '/download/app',
    '/terms/privacy-policy',
    '/admin',
    '/docs',
    '/home',
  ])('%s에서는 노출하지 않는다', (p) => {
    expect(isAppBannerPath(p)).toBe(false)
  })
})
