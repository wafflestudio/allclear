import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import * as qs from 'qs'
import { Metadata } from 'next'

const checkMobile = (): 'ios' | 'android' | 'other' | '' => {
  const device = navigator.userAgent.toLowerCase() // userAgent 값 얻기
  const mobile = /iphone|ipad|ipod|android/i.test(device)
  if (mobile) {
    // 모바일 처리
    if (device.indexOf('android') > -1) {
      // 안드로이드
      return 'android'
    }
    if (
      device.indexOf('iphone') > -1 ||
      device.indexOf('ipad') > -1 ||
      device.indexOf('ipod') > -1
    ) {
      // IOS
      return 'ios'
    }
    // 아이폰, 안드로이드 외
    return 'other'
  }

  return ''
}

const accessLog = (params: Record<string, string> = {}) => {
  return fetch(`/api/v1/users/download/app?${qs.stringify(params)}`, {
    method: 'POST',
  })
}

const playstore =
  'https://play.google.com/store/apps/details?id=com.padocorp.clubhouse.applicationId'
const appstore =
  'https://apps.apple.com/kr/app/%ED%81%B4%EB%9F%BD%ED%95%98%EC%9A%B0%EC%8A%A4-%EC%9A%B0%EB%A6%AC-%ED%95%99%EA%B5%90-%EB%AA%A8%EB%93%A0-%EB%8F%99%EC%95%84%EB%A6%AC/id6461214029'

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

  const [downloadLink, setDownloadLink] = useState<string>(appstore)

  useEffect(() => {
    const platform = checkMobile()
    const path = platform === 'android' ? playstore : platform === 'ios' ? appstore : appstore
    setDownloadLink(path)
    if (path) {
      const userAgent = navigator.userAgent.toLowerCase()
      accessLog({ platform, userAgent }).catch(console.error)
      setTimeout(() => router.push(path), 1000)
    }
  }, [downloadLink, router, router.isReady])

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

            <div className="flex items-center justify-center gap-4 mt-8 max-w-sm mx-auto">
              <a
                href={appstore}
                title=""
                className="inline-flex items-center justify-center w-full px-2 sm:px-4 py-3 text-left text-white bg-gray-900 rounded-lg sm:w-auto hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300"
                role="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-8 w-8 sm:w-10 sm:h-10"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.665 16.811a10.316 10.316 0 0 1-1.021 1.837c-.537.767-.978 1.297-1.316 1.592-.525.482-1.089.73-1.692.744-.432 0-.954-.123-1.562-.373-.61-.249-1.17-.371-1.683-.371-.537 0-1.113.122-1.73.371-.616.25-1.114.381-1.495.393-.577.025-1.154-.229-1.729-.764-.367-.32-.826-.87-1.377-1.648-.59-.829-1.075-1.794-1.455-2.891-.407-1.187-.611-2.335-.611-3.447 0-1.273.275-2.372.826-3.292a4.857 4.857 0 0 1 1.73-1.751 4.65 4.65 0 0 1 2.34-.662c.46 0 1.063.142 1.81.422s1.227.422 1.436.422c.158 0 .689-.167 1.593-.498.853-.307 1.573-.434 2.163-.384 1.6.129 2.801.759 3.6 1.895-1.43.867-2.137 2.08-2.123 3.637.012 1.213.453 2.222 1.317 3.023a4.33 4.33 0 0 0 1.315.863c-.106.307-.218.6-.336.882zM15.998 2.38c0 .95-.348 1.838-1.039 2.659-.836.976-1.846 1.541-2.941 1.452a2.955 2.955 0 0 1-.021-.36c0-.913.396-1.889 1.103-2.688.352-.404.8-.741 1.343-1.009.542-.264 1.054-.41 1.536-.435.013.128.019.255.019.381z"></path>
                </svg>

                <div className="ml-2.5">
                  <span className="block text-xs font-normal leading-none">Download on</span>
                  <span className="block text-lg font-bold leading-tight">AppStore</span>
                </div>
              </a>

              <a
                href={playstore}
                title=""
                className="inline-flex items-center justify-center w-full px-2 sm:px-4 py-3 text-left text-white bg-gray-900 rounded-lg sm:w-auto hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300"
                role="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-8 w-8 sm:w-10 sm:h-10"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="m12.954 11.616 2.957-2.957L6.36 3.291c-.633-.342-1.226-.39-1.746-.016l8.34 8.341zm3.461 3.462 3.074-1.729c.6-.336.929-.812.929-1.34 0-.527-.329-1.004-.928-1.34l-2.783-1.563-3.133 3.132 2.841 2.84zM4.1 4.002c-.064.197-.1.417-.1.658v14.705c0 .381.084.709.236.97l8.097-8.098L4.1 4.002zm8.854 8.855L4.902 20.91c.154.059.32.09.495.09.312 0 .637-.092.968-.276l9.255-5.197-2.666-2.67z"></path>
                </svg>

                <div className="ml-2.5">
                  <span className="block text-xs font-normal leading-none">Download on</span>
                  <span className="block text-lg font-bold leading-tight">Google Play</span>
                </div>
              </a>
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
