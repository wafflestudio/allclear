import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Head from 'next/head'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { openAppDeepLink } from '../../src/club/openInApp'
import ManagerTransferFallbackView from '../../src/managerTransfer/ManagerTransferFallbackView'
import {
  buildManagerTransferDeepPath,
  buildManagerTransferWebUrl,
  parseManagerTransferToken,
} from '../../src/managerTransfer/managerTransferFallback'

type Props = {
  token: string
  managerTransferUrl: string
}

const ManagerTransferFallbackPage = ({
  token,
  managerTransferUrl,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [hasAttemptedAppOpen, setHasAttemptedAppOpen] = useState(false)
  const hasAutomaticallyAttemptedAppOpen = useRef(false)
  const openManagerTransferInApp = useCallback(() => {
    setHasAttemptedAppOpen(true)
    return openAppDeepLink(buildManagerTransferDeepPath(token), {
      fallbackUrl: null,
    })
  }, [token])

  useEffect(() => {
    if (hasAutomaticallyAttemptedAppOpen.current) return
    hasAutomaticallyAttemptedAppOpen.current = true
    return openManagerTransferInApp()
  }, [openManagerTransferInApp])

  return (
    <>
      <Head>
        <title>관리자 권한 이전 | 올클</title>
        <meta name="description" content="올클 앱에서 동아리 관리자 권한 이전 요청을 확인하세요." />
        <meta
          name="apple-itunes-app"
          content={`app-id=6461214029, app-argument=${managerTransferUrl}`}
        />
      </Head>
      <ManagerTransferFallbackView
        onOpenApp={openManagerTransferInApp}
        hasAttemptedAppOpen={hasAttemptedAppOpen}
      />
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, req }) => {
  const token = parseManagerTransferToken(params?.token)
  if (!token) return { notFound: true }

  return {
    props: {
      token,
      managerTransferUrl: buildManagerTransferWebUrl(token, req.headers.host ?? ''),
    },
  }
}

export default ManagerTransferFallbackPage
