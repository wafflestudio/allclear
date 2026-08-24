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
