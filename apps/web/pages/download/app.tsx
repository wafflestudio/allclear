import type { Metadata } from 'next'
import { useRouter } from 'next/router'
import * as qs from 'qs'
import React, { useEffect, useRef, useState } from 'react'
import AppStoreButtons from '../../src/common/components/AppStoreButtons'
import { detectMobilePlatform, type MobilePlatform } from '../../src/common/constants/appStores'

const accessLog = (params: Record<string, string> = {}) => {
  return fetch(`/api/v2/users/download/app?${qs.stringify(params)}`, {
    method: 'POST',
  })
}

export const metadata: Metadata = {
  title: '서울대 모든 동아리 - 한 번에 올클하기',
  openGraph: {
    title: '서울대 모든 동아리 - 한 번에 올클하기',
    description: '스랖 에타 eTL 올클 렛츠고 🥳',
    images: ['/images/share-logo.png'],
  },
}
const AppDownload = () => {
  const router = useRouter()
  const [platform, setPlatform] = useState<MobilePlatform>('other')
  const hasRecordedAccess = useRef(false)

  useEffect(() => {
    if (!router.isReady || hasRecordedAccess.current) return

    hasRecordedAccess.current = true
    const userAgent = navigator.userAgent.toLowerCase()
    const detectedPlatform = detectMobilePlatform(userAgent)
    setPlatform(detectedPlatform)
    accessLog({ platform: detectedPlatform, userAgent }).catch(() => {})
  }, [router.isReady])

  return (
    <div className="h-screen bg-white flex flex-col">
      <section className="bg-white dark:g-gray-900 antialiased">
        <div className="max-w-screen-xl px-4 py-8 mx-auto lg:px-6 sm:py-16 lg:py-24">
          <div className="text-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight md:leading-loose text-gray-900 dark:ext-white sm:text-5xl lg:text-6xl">
                서울대 모든 동아리
                <span className="block">
                  한 번에 <span className="text-primary-600">올클</span>하기
                </span>
              </h2>
              <p className="mt-4 text-base font-normal text-gray-500 dark:ext-gray-400 md:max-w-3xl md:mx-auto sm:text-xl">
                이번 학기엔 동아리까지 올클!
                <br />
                스랖 에타 eTL 올클 렛츠고 🥳
              </p>
            </div>

            <div className="mt-8">
              <AppStoreButtons highlightedPlatform={platform} />
            </div>
          </div>

          <div className="my-8 sm:my-16">
            <div className="relative mx-auto border-gray-800  border-[14px] rounded-[2.5rem] h-[600px] w-[300px]">
              <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
              <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
              <div className="rounded-[2.5rem] overflow-hidden w-[272px] h-[572px] bg-white">
                <img src="/images/homescreen-preview.png" className="w-[272px] h-[572px]" alt="" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="mx-auto -mt-8 sm:-mt-16 mb-4">
        <span className="text-sm text-gray-500 dark:ext-gray-400 sm:text-center">
          © 2024{' '}
          <a href="#" className="hover:underline">
            신선한여울 Co., Ltd.
          </a>{' '}
          All Rights Reserved.
        </span>
      </footer>
    </div>
  )
}

export default AppDownload
