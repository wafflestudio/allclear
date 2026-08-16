const MAX_QUERY_LENGTH = 20
const DEFAULT_PLACEHOLDER = '동아리의 키워드 혹은 소속 학과로 검색해보세요'

type Props = {
  value: string
  onChange: (value: string) => void
  // 앱 SearchBar와 동일: 공백을 제거한 검색어를 넘기고, 비어 있으면 아무 일도 하지 않는다
  onSubmit: (query: string) => void
  placeholder?: string
}

// 앱 SearchBar와 동일: bg #F3F0F5, radius 10, 위아래 16 / 왼쪽 18 / 오른쪽 15,
// 검색 아이콘 15, 입력 13/500 (#202020, placeholder #C1C1C1), 최대 20자,
// 입력 중에는 "n/20" 카운터(14/500) + 지우기(14, hitSlop 8)
export function SearchBar({ value, onChange, onSubmit, placeholder = DEFAULT_PLACEHOLDER }: Props) {
  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed.length === 0) return
    onSubmit(trimmed)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      className="flex items-center rounded-[10px] bg-[#F3F0F5] py-4 pl-[18px] pr-[15px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/search-icon.png"
        alt=""
        width={15}
        height={15}
        className="h-[15px] w-[15px] shrink-0 object-contain"
      />
      <input
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_QUERY_LENGTH))}
        maxLength={MAX_QUERY_LENGTH}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-label="동아리 검색"
        className="ml-2.5 min-w-0 flex-1 appearance-none rounded-none bg-transparent p-0 text-[13px] font-medium leading-4 text-[#202020] outline-none placeholder:text-[#C1C1C1] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />
      {value.length > 0 && (
        <span className="ml-2 flex shrink-0 items-center gap-[7px]">
          <span className="text-[14px] font-medium leading-[17px]">
            <span className="text-[#757474]">{value.length}</span>
            <span className="text-[#C1C1C1]">/{MAX_QUERY_LENGTH}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="검색어 지우기"
            className="-m-2 p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/search-reset.png"
              alt=""
              width={14}
              height={14}
              className="h-[14px] w-[14px] object-contain"
            />
          </button>
        </span>
      )}
    </form>
  )
}
