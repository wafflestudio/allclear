const MAX_QUERY_LENGTH = 20

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

// 앱 SearchBar와 동일: bg #F3F0F5, radius 10, 아이콘 15, 입력 13/500, 카운터 + 지우기
export function SearchBar({ value, onChange, onSubmit }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex items-center rounded-[10px] bg-[#F3F0F5] py-4 pl-[18px] pr-[15px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/search-icon.png" alt="" width={15} height={15} className="object-contain" />
      <input
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_QUERY_LENGTH))}
        maxLength={MAX_QUERY_LENGTH}
        placeholder="동아리의 키워드 혹은 소속 학과로 검색해보세요"
        autoCapitalize="none"
        autoCorrect="off"
        className="ml-2.5 min-w-0 flex-1 bg-transparent p-0 text-[13px] font-medium text-[#202020] placeholder-[#C1C1C1] outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value.length > 0 && (
        <span className="ml-2 flex shrink-0 items-center gap-[7px]">
          <span className="text-[14px] font-medium">
            <span className="text-[#757474]">{value.length}</span>
            <span className="text-[#C1C1C1]">/{MAX_QUERY_LENGTH}</span>
          </span>
          <button type="button" onClick={() => onChange('')} aria-label="검색어 지우기">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/search-reset.png"
              alt=""
              width={14}
              height={14}
              className="object-contain"
            />
          </button>
        </span>
      )}
    </form>
  )
}
