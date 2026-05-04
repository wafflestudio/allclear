import React, { useEffect } from 'react'
import { useRouter } from 'next/router'

const pullbackURL = 'https://all-clear.cc'

const ClubDeepLink = () => {
  const router = useRouter()
  const { uuid } = router.query

  useEffect(() => {
    if (!router.isReady || !uuid) return

    // Universal Links가 작동하지 않을 때 커스텀 스킴으로 재시도
    window.location.href = `allclear://club/${uuid}`

    // 앱이 없는 경우 App Store로 폴백
    setTimeout(() => {
      window.location.href = pullbackURL
    }, 2000)
  }, [router.isReady, uuid])

  return (
    <div className="h-screen bg-white flex items-center justify-center">
      <p className="text-gray-500 text-lg">앱으로 이동 중...</p>
    </div>
  )
}

export default ClubDeepLink
