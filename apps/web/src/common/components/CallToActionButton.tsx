import React from 'react'
import clsx from 'clsx'

type Props = {
  content: string
  disabled?: boolean
  onClick: () => void
}

const CallToActionButton: React.FC<Props> = ({ content, disabled, onClick }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={clsx({
      'text-md my-1 mr-2 gap-2 whitespace-nowrap rounded-lg bg-primary-700 px-5 py-2.5 text-center font-medium text-white dark:bg-primary-600':
        true,
      'cursor-not-allowed bg-primary-400 text-gray-100 dark:bg-primary-500': disabled,
      'hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:hover:bg-primary-700 dark:focus:ring-primary-800':
        !disabled,
    })}
  >
    {content}
  </button>
)

export default CallToActionButton
