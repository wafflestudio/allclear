import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { consumeLoginNextPath, fetchProfile, useProfile } from '../../src/club/auth/AuthContext'
import { setLoginToken } from '../../src/club/auth/token'

// 카카오 OAuth 완료 후 #token=... 을 받아 저장하는 페이지 (admin/auth/callback과 동일 패턴)
const AuthCallbackPage = () => {
  const router = useRouter()
  const { setUser } = useProfile()
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get('token')
    window.history.replaceState(null, '', '/auth/callback')

    if (!token) {
      toast.error('로그인에 실패했어요!')
      router.replace('/club')
      return
    }

    setLoginToken(token)
    fetchProfile()
      .then((user) => {
        setUser(user)
        toast.info('로그인 되었어요!')
      })
      .catch(() => {
        toast.error('로그인에 실패했어요!')
      })
      .finally(() => {
        router.replace(consumeLoginNextPath())
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
      <p className="text-[14px] font-normal text-[#757474]">로그인 중...</p>
    </div>
  )
}

export default AuthCallbackPage
