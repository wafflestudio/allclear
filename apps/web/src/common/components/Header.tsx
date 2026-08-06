import React from 'react'
import { PagePath } from '../constants/PagePath'
import { ChannelTalkScript } from '../connectors/channeltalk'

type Props = {
  title?: string
}
export const Header = ({ title = '올클' }: Props) => {
  return (
    <header className={'w-full min-w-full border-b'}>
      <ChannelTalkScript />
      <nav className="border-gray-200 bg-white py-2.5 pr-4 pl-6 dark:bg-gray-800 lg:px-6">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between">
          <a href={PagePath.HOME} className="flex items-center">
            <img src="/images/logo.png" className="mr-3 h-6 sm:h-9" alt="Flowbite Logo" />
            <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
              {title}
            </span>
          </a>
        </div>
      </nav>
    </header>
  )
}
