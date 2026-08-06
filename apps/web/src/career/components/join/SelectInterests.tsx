import React from 'react'
import clsx from 'clsx'
import { chunk } from 'lodash-es'
import { toggleItemInArray } from '../../../common/utils'
import { Interest } from '../../domain/types/Interest'

const interests: Interest[] = [
  { id: 1, name: '인턴' },
  { id: 2, name: '동아리/학회' },
  { id: 3, name: '창업' },
  { id: 4, name: '교환학생' },
  { id: 5, name: '랩인턴' },
  { id: 6, name: '로스쿨' },
  { id: 7, name: '고시' },
  { id: 8, name: '복/부전공' },
]

type Props = {
  interestIds: number[]
  setInterestIds: (ids: number[]) => void
}

const SelectInterests: React.FC<Props> = ({ interestIds, setInterestIds }) => {
  return (
    <div className={'flex h-full w-full flex-col gap-5'}>
      {chunk(interests, 3).map((tripleInterests) => (
        <div className={'flex gap-4'}>
          {tripleInterests.map((interest) => (
            <button
              key={interest.id}
              onClick={() => {
                const newInterestIds = toggleItemInArray(interestIds, interest.id)
                newInterestIds.length <= 3 && setInterestIds(newInterestIds)
              }}
              className={clsx({
                'text-md w-fit grow whitespace-nowrap rounded-2xl border border-primary-700 bg-white px-5 py-2.5 text-center font-medium dark:bg-black':
                  true,
                'hover:bg-primary-200 focus:outline-none dark:hover:bg-primary-800':
                  !interestIds.includes(interest.id) && interestIds.length <= 2,
                'text-gray-500': !interestIds.includes(interest.id),
                'bg-primary-300 text-black dark:bg-primary-600': interestIds.includes(interest.id),
              })}
            >
              {interest.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
export default SelectInterests
