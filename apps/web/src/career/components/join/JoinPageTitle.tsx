import React from 'react'
import clsx from 'clsx'

type Props = {
  title: string | React.ReactNode
  subtitle?: string | React.ReactNode
}

const JoinPageTitle: React.FC<Props> = ({ title, subtitle }) => (
  <div className="flex max-w-screen-sm flex-col gap-2 px-2 text-start lg:mb-16">
    <h2
      className={clsx({
        'whitespace-pre-wrap text-xl font-bold tracking-normal text-gray-900 dark:text-white': true,
        'mb-2': !subtitle,
      })}
    >
      {title}
    </h2>
    {subtitle && (
      <p className="whitespace-pre-wrap text-sm font-light text-gray-600 dark:text-gray-400">
        {subtitle}
      </p>
    )}
  </div>
)

export default JoinPageTitle
