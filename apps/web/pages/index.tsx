import type { Metadata, NextPage } from 'next'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { PagePath } from '../src/common/constants/PagePath'

export const metadata: Metadata = {
  title: '서울대 모든 동아리 - 한 번에 올클하기',
  openGraph: {
    title: '서울대 모든 동아리 - 한 번에 올클하기',
    description: '스랖 에타 eTL 올클 렛츠고 🥳',
    images: ['/images/share-logo.png'],
  },
}

const Home: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) {
      return
    }
    setTimeout(() => router.replace(PagePath.APP_DOWNLOAD), 0)
  }, [router, router.isReady])

  return (
    <div className={'flex h-100v w-screen bg-white scrollbar-hide flex-col'}>
      <div
        className={'mx-auto my-auto text-center text-5xl font-extrabold text-white'}
        onClick={() => router.push(PagePath.HOME)}
      >
        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
          이번 학기엔{' '}
          <span className="underline-offset-3 underline decoration-primary-400 decoration-8 dark:decoration-blue-600">
            <mark className="bg-white text-primary-600">동아리</mark>
          </span>
          까지{' '}
          <span className="underline-offset-3 underline decoration-primary-400 decoration-8 dark:decoration-blue-600">
            <span className="bg-white text-primary-600">올클</span>!
          </span>
        </h1>
        <p className="whitespace-nowrap text-xl font-normal text-gray-500 dark:text-gray-400 lg:text-xl">
          스랖 에타 eTL 올클 렛츠고!
        </p>
      </div>
      <footer className="mx-auto mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400 sm:text-center">
          © 2023{' '}
          <a href="#" className="hover:underline">
            신선한여울 Co., Ltd.
          </a>{' '}
          All Rights Reserved.
        </span>
      </footer>
    </div>
  )
}

export default Home
