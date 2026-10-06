import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectMobilePlatform } from './appStores'

describe('app store selection', () => {
  it.each([
    ['Mozilla/5.0 (Linux; Android 15)', 'android'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)', 'ios'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'other'],
  ] as const)('%s 사용자 에이전트를 %s로 감지한다', (userAgent, platform) => {
    expect(detectMobilePlatform(userAgent)).toBe(platform)
  })

  it('다운로드 페이지는 사용자 에이전트와 무관하게 스토어로 자동 이동하지 않는다', () => {
    const source = readFileSync(join(process.cwd(), 'pages/download/app.tsx'), 'utf8')

    expect(source).not.toMatch(/router\.(push|replace)\(/)
    expect(source).not.toContain('setTimeout(')
  })
})
