import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { getServerSideProps } from '../../pages/manager-transfer/[token]'
import AppStoreButtons from '../common/components/AppStoreButtons'
import ManagerTransferFallbackView from './ManagerTransferFallbackView'
import {
  buildManagerTransferAppUrl,
  buildManagerTransferWebUrl,
  parseManagerTransferToken,
  shouldAutomaticallyOpenManagerTransfer,
} from './managerTransferFallback'

describe('manager transfer web fallback', () => {
  const token = 'a'.repeat(43)

  it('원래 토큰을 앱 URL과 Smart App Banner URL에 보존한다', () => {
    expect(parseManagerTransferToken(token)).toBe(token)
    expect(buildManagerTransferAppUrl(token)).toBe(`allclear://manager-transfer/${token}`)
    expect(buildManagerTransferWebUrl(token, 'dev.all-clear.cc')).toBe(
      `https://dev.all-clear.cc/manager-transfer/${token}`,
    )
  })

  it('지원하지 않는 www 호스트는 entitlement에 등록된 운영 호스트로 정규화한다', () => {
    expect(buildManagerTransferWebUrl(token, 'www.all-clear.cc')).toBe(
      `https://all-clear.cc/manager-transfer/${token}`,
    )
  })

  it('같은 토큰은 한 번만 자동 실행하고 새 토큰은 다시 자동 실행한다', () => {
    expect(shouldAutomaticallyOpenManagerTransfer(token, null)).toBe(true)
    expect(shouldAutomaticallyOpenManagerTransfer(token, token)).toBe(false)
    expect(shouldAutomaticallyOpenManagerTransfer('b'.repeat(43), token)).toBe(true)
  })

  it('유효한 동적 경로를 redirect 없이 서버 렌더링한다', async () => {
    const result = await getServerSideProps({
      params: { token },
      req: { headers: { host: 'dev.all-clear.cc' } },
    } as never)

    expect(result).toEqual({
      props: {
        token,
        managerTransferUrl: `https://dev.all-clear.cc/manager-transfer/${token}`,
      },
    })
  })

  it.each(['', 'short', 'contains/slash', 'a'.repeat(257)])(
    '유효하지 않은 토큰 %s를 거부한다',
    (invalidToken) => {
      expect(parseManagerTransferToken(invalidToken)).toBeNull()
    },
  )

  it('앱 열기 버튼과 두 스토어 선택지를 함께 표시한다', () => {
    const markup = renderToStaticMarkup(
      <ManagerTransferFallbackView onOpenApp={vi.fn()} hasAttemptedAppOpen={true} />,
    )

    expect(markup).toContain('올클 앱에서 열기')
    expect(markup).toContain('앱이 열리지 않으면')
    expect(markup).toContain('App Store')
    expect(markup).toContain('Google Play')
  })

  it('Android에서도 App Store와 Google Play를 모두 직접 선택할 수 있다', () => {
    const markup = renderToStaticMarkup(<AppStoreButtons highlightedPlatform="android" />)

    expect(markup).toContain('App Store')
    expect(markup).toContain('Google Play')
  })
})
