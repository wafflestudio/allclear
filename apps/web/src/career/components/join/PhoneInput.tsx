import React, { useEffect } from 'react'

type Props = {
  content: string
  setContent: (content: string) => void
  onPressEnter?: () => void
}

const PhoneInput: React.FC<Props> = ({ content, setContent, onPressEnter }) => {
  const inputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  return (
    <div className={'mt-2 mr-2'}>
      <label
        htmlFor="phone_input_group"
        className="text-md mb-1 block font-light text-black dark:text-gray-400"
      >
        휴대전화 번호
      </label>
      <div className={'flex gap-3'}>
        <div id={'phone_input_group'}>
          <select
            disabled
            defaultValue={'+82'}
            className="text-md peer w-16 appearance-none border-0 border-b border-green-600 bg-transparent px-0 text-gray-700 focus:border-gray-200 focus:outline-none focus:ring-0 disabled:text-gray-700 disabled:opacity-100 dark:border-gray-700 dark:text-gray-400"
          >
            <option value="+82">+82</option>
          </select>
        </div>
        <input
          ref={inputRef}
          type="tel"
          pattern="[0-9]{0,11}"
          inputMode="numeric"
          id="phone_input"
          aria-describedby="phone_input_help"
          className="text-md peer block w-full appearance-none border-0 border-b border-green-600 bg-transparent px-0.5 tracking-widest text-gray-900 placeholder:text-sm placeholder:tracking-normal focus:border-green-600 focus:outline-none focus:ring-0 dark:border-green-500 dark:text-white dark:focus:border-green-500"
          placeholder="휴대전화 번호 (- 없이) 입력"
          value={content}
          onChange={(e) => {
            const digits = e.target.value.replaceAll(/\D+/g, '').slice(0, 11)
            setContent(digits)
          }}
          onKeyDown={(e) => {
            if (e.code === 'Enter' || e.code === 'NumpadEnter') {
              e.preventDefault()
              onPressEnter?.()
            }
          }}
        />
      </div>
    </div>
  )
}
export default PhoneInput
