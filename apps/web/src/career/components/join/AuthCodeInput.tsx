import React, { useEffect } from 'react'

type Props = {
  authcode: string
  setAuthcode: (code: string) => void
}

const AuthCodeInput: React.FC<Props> = ({ authcode, setAuthcode }) => {
  const inputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  return (
    <div className="relative z-0">
      <label
        htmlFor="authcode_input"
        className="text-md mb-1 block font-light text-black dark:text-gray-400"
      >
        인증 번호
      </label>
      <input
        ref={inputRef}
        type="number"
        pattern="[0-9]{0,6}"
        inputMode="numeric"
        id="authcode_input"
        aria-describedby="phone_input_help"
        className="text-md peer my-1.5 block w-full appearance-none border-0 border-b-2 border-green-600 bg-transparent px-0 tracking-widest text-gray-900 placeholder-gray-400 focus:border-green-600 focus:outline-none focus:ring-0 dark:border-green-500 dark:text-white dark:focus:border-green-500"
        placeholder="인증 번호 6자리"
        value={authcode}
        onChange={(e) => {
          const digits = e.target.value.replaceAll(/\D+/g, '').slice(0, 6)
          setAuthcode(digits)
        }}
      />
    </div>
  )
}

export default AuthCodeInput
