import React from 'react'
import { useRouter } from 'next/router'
import LeftArrowIcon from '../../../common/components/LeftArrowIcon'

type Props = {
  onClick?: () => void
}
const GoBackButton: React.FC<Props> = ({ onClick }) => {
  const router = useRouter()

  return (
    <div className={'flex h-10 w-full max-w-screen-sm items-end'}>
      <div className="cursor-pointer rounded-full" onClick={onClick ?? (() => router.back())}>
        <LeftArrowIcon className={'h-5 w-5 stroke-2 text-black dark:text-white'} />
      </div>
    </div>
  )
}
export default GoBackButton
