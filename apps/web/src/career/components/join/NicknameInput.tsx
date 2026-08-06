import React, { useEffect } from 'react'
import clsx from 'clsx'

type Props = {
  content: string
  setContent: (content: string) => void
  isAllowed: boolean
  onPressEnter?: () => void
}

const NicknameInput: React.FC<Props> = ({ content, setContent, isAllowed, onPressEnter }) => {
  const inputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  return (
    <div>
      <label
        htmlFor="nickname_input_group"
        className="text-md mb-2 block font-light text-black dark:text-gray-400"
      >
        닉네임
      </label>
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        id="nickname_input"
        aria-describedby="nickname_input_help"
        className={clsx({
          'text-md border-1 peer block w-full appearance-none whitespace-nowrap rounded-2xl bg-transparent px-4 tracking-widest text-gray-900 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-0 dark:text-white':
            true,
          'border-green-600 focus:border-green-600 dark:border-green-500 dark:border-green-500 dark:focus:border-green-500':
            isAllowed,
          'border-red-600 focus:border-red-600 dark:border-red-500 dark:border-red-500 dark:focus:border-red-500':
            !isAllowed && content,
          'border-gray-600 focus:border-gray-600 dark:border-gray-500 dark:border-gray-500 dark:focus:border-gray-500':
            !isAllowed && !content,
        })}
        placeholder="닉네임을 입력해주세요."
        value={content}
        onChange={(e) => {
          const withoutSpaces = e.target.value.replaceAll(/\s+/g, '').slice(0, 8)
          setContent(withoutSpaces)
        }}
        onKeyDown={(e) => {
          if (e.code === 'Enter' || e.code === 'NumpadEnter') {
            e.preventDefault()
            onPressEnter?.()
          }
        }}
      />
      <p
        id="nickname_input_help"
        className={clsx({
          'mt-2 px-4 text-xs': true,
          ' text-green-600 dark:text-green-400': isAllowed,
          'text-red-600 dark:text-red-400': !isAllowed && content,
          'text-gray-600 dark:text-gray-400': !isAllowed && !content,
        })}
      >
        <span className="font-medium">
          {isAllowed
            ? '사용가능한 닉네임입니다.'
            : content
            ? '사용할 수 없는 닉네임입니다.'
            : '2자~8자의 닉네임을 입력해주세요. (공백 불가)'}
        </span>
      </p>
    </div>
  )
}

export default NicknameInput
