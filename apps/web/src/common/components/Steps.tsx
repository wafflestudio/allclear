import React from 'react'
import clsx from 'clsx'

export const Steps: React.FC<{ step: number; titles: string[] }> = ({ step, titles }) => (
  <ul className="steps">
    {titles.map((content, index) => (
      <li
        className={clsx({
          'step text-2xs text-primary-300 before:!h-1 after:!h-5 after:!w-5 after:!bg-primary-300':
            true,
          'step-primary text-primary-700 after:!bg-primary-500': index < step,
          'after:!text-primary-700': index < step - 1,
        })}
        data-content={index < step ? '✓' : ''}
      >
        <span className={'-mt-0.5'}>{content}</span>
      </li>
    ))}
  </ul>
)
