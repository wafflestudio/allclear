import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { PagePath } from '../src/common/constants/PagePath'

const PageNotFound = () => {
  const router = useRouter()

  useEffect(() => {
    router.replace(PagePath.LANDING_PAGE)
  }, [router])

  return <div className="h-100v w-screen" />
}

export default PageNotFound
