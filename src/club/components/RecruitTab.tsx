import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import type { V1Club } from '../../../server/service/v1/club.service'
import { AppGateOverlay } from './AppGateOverlay'
import { BackgroundCard } from './BackgroundCard'
import { HtmlContent } from './HtmlContent'

const UPDATE_REQUEST_FORM_URL = 'https://tally.so/r/EkQrQN'

// 앱과 동일한 포맷: "7월 13일 월요일 오후 3시에 업데이트 되었어요" (연도가 다르면 "YY년 " 접두)
function formatUploadedAt(iso: string): string {
  const date = dayjs(iso).locale('ko')
  const yearPrefix = date.year() !== dayjs().year() ? date.format('YY년 ') : ''
  return `${yearPrefix}${date.format('M월 D일 dddd A h시')}에 업데이트 되었어요`
}

type Props = {
  club: V1Club
  gated: boolean
}

export function RecruitTab({ club, gated }: Props) {
  const hasArticle = club.article.trim() !== ''

  return (
    <div className="mt-4">
      <BackgroundCard className="relative min-h-[200px]">
        {hasArticle ? (
          <>
            <HtmlContent html={club.article} />
            {gated && <AppGateOverlay clubName={club.name} tabLabel="모집공고" uuid={club.uuid} />}
          </>
        ) : (
          <div className="flex min-h-[120px] items-center justify-center">
            <p className="text-center text-[12px] font-normal leading-[18px] text-[#757474]">
              아직 등록된 모집공고가 없어요
            </p>
          </div>
        )}
      </BackgroundCard>

      <div className="mt-2 flex items-center px-2.5">
        {club.articleUploadedAt && (
          <p className="mt-1 min-w-0 truncate text-[12px] font-normal leading-[18px] text-[#757474]">
            {formatUploadedAt(club.articleUploadedAt)}
          </p>
        )}
        <a
          href={UPDATE_REQUEST_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto pl-2 text-[12px] font-normal leading-[18px] text-[#757474] underline active:opacity-50"
        >
          업데이트 요청
        </a>
      </div>
    </div>
  )
}
