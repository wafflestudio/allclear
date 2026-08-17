import { useRouter } from 'next/router'
import { useEffect } from 'react'

const PageNotFound = () => {
  const router = useRouter()

  useEffect(() => {
    router.replace('/download/app')
  }, [router])

  return <div className="h-100v w-screen" />
}

export default PageNotFound
