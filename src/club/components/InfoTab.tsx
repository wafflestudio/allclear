import { useEffect, useRef, useState } from 'react'
import type { V1Club } from '../../../server/service/v1/club.service'
import { BackgroundCard } from './BackgroundCard'
import { HTML_CONTENT_CLASS, useSanitizedHtml } from './HtmlContent'
import { MdiIcon } from './icons'

const COLLAPSED_MAX_HEIGHT = 115

type Props = {
  club: V1Club
}

export function InfoTab({ club }: Props) {
  const iconItems = [
    {
      key: '분류',
      value: club.type ? `${club.type} 동아리` : '',
      icon: '/icons/clubInfo/club-type.png',
    },
    { key: '단과대학', value: club.college, icon: '/icons/clubInfo/college.png' },
    {
      key: '모집형태',
      value: club.recruitType ? `${club.recruitType} 모집` : '',
      icon: '/icons/clubInfo/recruit-type.png',
    },
  ].filter((item) => item.value.trim() !== '')

  const detailRows = [
    { label: '활동주기', value: club.activityCycle },
    { label: '회비', value: club.membershipFee },
  ].filter((row) => row.value.trim() !== '')

  const hasIntroduction = club.introduction.trim() !== ''
  const isEmpty = iconItems.length === 0 && detailRows.length === 0 && !hasIntroduction

  if (isEmpty) {
    return (
      <BackgroundCard className="mt-4">
        <div className="flex min-h-[160px] items-center justify-center">
          <p className="text-center text-[12px] font-normal leading-[18px] text-[#757474]">
            아직 등록된 상세정보가 없어요.
          </p>
        </div>
      </BackgroundCard>
    )
  }

  return (
    <BackgroundCard className="mt-4">
      <div className="flex flex-col gap-5">
        {iconItems.length > 0 && (
          <div className="flex">
            {iconItems.map((item, index) => (
              <div key={item.key} className="flex min-w-0 flex-1 items-stretch">
                {index > 0 && <div className="w-px self-stretch bg-[#EAEAEA]" />}
                <div className="flex flex-1 flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.icon} alt="" width={30} height={30} />
                  <span className="text-center text-[14px] font-medium text-[#757474]">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasIntroduction && <IntroductionSection introduction={club.introduction} />}

        {detailRows.length > 0 && (
          <div className="flex flex-col gap-3">
            {detailRows.map((row) => (
              <div key={row.label} className="flex items-start">
                <span className="w-[76px] shrink-0 text-[14px] font-normal text-[#BCBCBC]">
                  {row.label}
                </span>
                <span className="flex-1 text-[14px] font-medium text-[#757474]">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </BackgroundCard>
  )
}

// 상세설명: 115px 넘게 길면 접어두고 그라데이션 + 화살표 토글 (앱과 동일)
function IntroductionSection({ introduction }: { introduction: string }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isLong, setIsLong] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const safeHtml = useSanitizedHtml(introduction)

  // HTML 주입 시점과 이후 크기 변화(이미지 로딩 등) 모두에서 재측정
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const check = () => setIsLong(el.scrollHeight > COLLAPSED_MAX_HEIGHT)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [safeHtml])

  const collapsed = isLong && !isExpanded

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] font-normal text-[#BCBCBC]">상세설명</p>
      <div className="relative">
        <div
          className="overflow-hidden"
          style={collapsed ? { maxHeight: COLLAPSED_MAX_HEIGHT } : undefined}
        >
          {safeHtml !== null && (
            <div
              ref={contentRef}
              className={HTML_CONTENT_CLASS}
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          )}
        </div>
        {collapsed && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[28px]"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0), #FFFFFF)' }}
          />
        )}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="-mt-2 flex justify-center text-[#757474]"
          aria-label={isExpanded ? '상세설명 접기' : '상세설명 펼치기'}
        >
          <MdiIcon name={isExpanded ? 'chevronUp' : 'chevronDown'} size={24} />
        </button>
      )}
    </div>
  )
}
