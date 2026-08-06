import React from 'react'
import { IconProps } from '../../common/components/IconProps'
import RocketLaunchIcon from '../../common/components/RocketLaunchIcon'
import SquareTripleStackIcon from '../../common/components/SquareTripleStackIcon'
import WalletIcon from '../../common/components/WalletIcon'

const icons: React.FC<IconProps>[] = [RocketLaunchIcon, SquareTripleStackIcon, WalletIcon]

const CareerCategoryCard = ({
  title,
  icon,
  onClick,
}: {
  title: string
  icon?: React.FC<IconProps>
  onClick?: () => void
}) => {
  const IconComponent = icon ?? icons[Math.floor(Math.random() * 3)]

  return (
    <div
      className="delay-50 flex aspect-square h-full w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-primary-100 bg-white p-4 shadow-lg transition duration-300 ease-in-out hover:bg-primary-100 hover:shadow-xl focus:bg-primary-100 focus:shadow-lg focus:outline-none focus:ring-1 focus:ring-primary-100 focus:ring-offset-1"
      onClick={onClick}
    >
      <IconComponent className={'mx-auto my-auto h-8 w-8 fill-primary-500'} />
      <h3 className="text-md overflow-x-hidden whitespace-nowrap font-bold">{title}</h3>
    </div>
  )
}

export default CareerCategoryCard
