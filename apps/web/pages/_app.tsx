import '../styles/globals.css'
import 'swagger-ui-react/swagger-ui.css'

import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import Script from 'next/script'
import { AuthProvider } from '../src/club/auth/AuthContext'
import { AppBannerProvider } from '../src/club/components/AppInstallBanner'
import * as GA from '../src/common/connectors/ga'
import { WEB_ENV } from '../src/WEB_ENV'

export const metadata: Metadata = {
  title: '서울대 모든 동아리 - 한 번에 올클하기',
  openGraph: {
    title: '서울대 모든 동아리 - 한 번에 올클하기',
    description: '스랖 에타 eTL 올클 렛츠고 🥳',
    images: ['/images/share-logo.png'],
  },
}
const App = ({ Component, pageProps }: AppProps) => {
  GA.init()

  const router = useRouter()
  useEffect(() => {
    const handleRouteChange = (url) => {
      GA.setPageview(url)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    router.events.on('hashChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
      router.events.off('hashChangeComplete', handleRouteChange)
    }
  }, [router.events])

  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <React.Fragment>
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        ></meta>
      </Head>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${WEB_ENV.GA.TRACKING_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${WEB_ENV.GA.TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <QueryClientProvider client={queryClientRef.current}>
        <AuthProvider>
          <AppBannerProvider>
            <Component {...pageProps} />
          </AppBannerProvider>
        </AuthProvider>
        <ToastContainer
          position="top-center"
          // 앱 설치 배너가 떠 있으면 그 아래에 뜨게 한다 (배너가 없으면 기본 위치)
          style={{ top: 'calc(1em + var(--app-banner-h, 0px))' }}
          autoClose={2000}
          theme="colored"
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <ReactQueryDevtools />
      </QueryClientProvider>
      <Analytics />
    </React.Fragment>
  )
}

export default App
