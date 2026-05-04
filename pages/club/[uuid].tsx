import React, { useEffect } from 'react'
import { useRouter } from 'next/router'

const appstore = 'https://apps.apple.com/kr/app/%EC%98%AC%ED%81%B4/id6461214029'
const playstore = 'https://play.google.com/store/apps/details?id=com.padocorp.clubhouse.applicationId'

const checkMobile = (): 'ios' | 'android' | 'other' => {
  if (typeof window === 'undefined') return 'other'
  const device = navigator.userAgent.toLowerCase()
  if (device.indexOf('android') > -1) {
    return 'android'
  }
  if (
    device.indexOf('iphone') > -1 ||
    device.indexOf('ipad') > -1 ||
    device.indexOf('ipod') > -1
  ) {
    return 'ios'
  }
  return 'other'
}

const ClubDeepLink = () => {
  const router = useRouter()
  const { uuid } = router.query

  useEffect(() => {
    if (!router.isReady || !uuid) return

    // Universal Links가 작동하지 않을 때 커스텀 스킴으로 재시도
    window.location.href = `allclear://club/${uuid}`

    // 앱이 없는 경우 플랫폼에 따라 적절한 스토어로 폴백
    const platform = checkMobile()
    const fallbackUrl = platform === 'android' ? playstore : appstore
    setTimeout(() => {
      window.location.href = fallbackUrl
    }, 2000)
  }, [router.isReady, uuid])

  return (
    <div className="h-screen bg-white flex items-center justify-center">
      <p className="text-gray-500 text-lg">앱으로 이동 중...</p>
    </div>
  )
}

export default ClubDeepLink
