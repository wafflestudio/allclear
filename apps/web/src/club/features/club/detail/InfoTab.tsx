import { Fragment, useEffect, useRef, useState } from 'react'
import type { Club } from '../../../../../server/domain/model/Club'
import { HTML_CONTENT_CLASS, useSanitizedHtml } from '../../../shared/components/HtmlContent'
import { MdiIcon, type MdiIconName } from '../../../shared/components/icons'
import { BackgroundCard } from './BackgroundCard'
import { ImageViewerModal } from './ImageViewerModal'
import { BooleanPills, DetailTag } from './Pills'

const COLLAPSED_MAX_HEIGHT = 115

const LABEL_CLASS = 'text-[14px] font-normal text-[#BCBCBC]'

const formatFoundedAt = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number)
  return year && month && day ? `${year}년 ${month}월 ${day}일` : value
}

// 앱 InfoTab 의 StatePills: 있음/없음 알약 + (선택) 상세 태그. detailOnNewLine 이면 태그를 다음 줄에 둔다.
function StatePills({
  active,
  trueLabel = '있음',
  falseLabel = '없음',
  falseFirst = false,
  detail,
  detailOnNewLine = false,
}: {
  active: boolean
  trueLabel?: string
  falseLabel?: string
  falseFirst?: boolean
  detail?: string
  detailOnNewLine?: boolean
}) {
  return (
    <div
      className={
        detailOnNewLine
          ? 'flex flex-col items-start gap-1.5'
          : 'flex flex-wrap items-center gap-1.5'
      }
    >
      <BooleanPills
        active={active}
        trueLabel={trueLabel}
        falseLabel={falseLabel}
        falseFirst={falseFirst}
        keepTrackingWhenSelected
      />
      {!!detail && <DetailTag text={detail} />}
    </div>
  )
}

type Props = {
  club: Club
}

/**
 * 앱 ClubDetail/InfoTab.tsx 와 동일:
 * 카드(분류/카테고리/모집형태 아이콘 행 → 동방 유무 · 최소활동 기간 → 상세설명(접기) → 설립일 · 활동 인원)
 * + 활동 사진 가로 스크롤(탭하면 확대 뷰어)
 */
export function InfoTab({ club }: Props) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const introduction = club.introduction?.trim()
  const minActivityPeriod = club.minActivityPeriod ?? 0
  const activityImageUrls = club.activityImageUrls ?? []
  const activeMemberCount = club.activeMemberCount ?? 0
  const topItems: { label: string; value: string; icon: MdiIconName }[] = [
    { label: '분류', value: `${club.type} 동아리`, icon: 'accountGroupOutline' },
    { label: '카테고리', value: club.category, icon: 'shapeOutline' },
    { label: '모집형태', value: `${club.recruitType} 모집`, icon: 'accountPlusOutline' },
  ]

  return (
    <div className="mt-4 flex flex-col gap-5">
      <BackgroundCard>
        <div className="flex flex-col gap-[22px]">
          <div className="flex">
            {topItems.map((item, index) => (
              <Fragment key={item.label}>
                {index > 0 && <div className="w-px self-stretch bg-[#EAEAEA]" />}
                <div className="flex min-w-0 flex-1 flex-col items-center gap-[5px] px-1">
                  <span className="text-[#874FFF]">
                    <MdiIcon name={item.icon} size={28} />
                  </span>
                  <span className="text-[12px] font-normal leading-[18px] text-[#BCBCBC]">
                    {item.label}
                  </span>
                  <span className="line-clamp-2 text-center text-[14px] font-medium text-[#757474]">
                    {item.value}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-2">
              <p className={LABEL_CLASS}>동방 유무</p>
              <StatePills
                active={club.hasDongbang}
                trueLabel="동방보유"
                falseLabel="동방없음"
                detail={club.dongbangLocation ? club.dongbangLocation : undefined}
                detailOnNewLine
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className={LABEL_CLASS}>최소활동 기간</p>
              <StatePills
                active={minActivityPeriod > 0}
                falseFirst
                detail={minActivityPeriod > 0 ? `${minActivityPeriod}학기` : undefined}
              />
            </div>
          </div>

          {!!introduction && <IntroductionSection introduction={introduction} />}

          {(club.foundedAt || activeMemberCount > 0) && (
            <div className="flex flex-col gap-3">
              {!!club.foundedAt && (
                <div className="flex items-center">
                  <p className={LABEL_CLASS}>설립일</p>
                  <p className="ml-auto text-[14px] font-medium text-[#757474]">
                    {formatFoundedAt(club.foundedAt)}
                  </p>
                </div>
              )}
              {activeMemberCount > 0 && (
                <div className="flex items-center">
                  <p className={LABEL_CLASS}>활동 인원</p>
                  <p className="ml-auto text-[14px] font-medium text-[#757474]">
                    약 {activeMemberCount}명
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </BackgroundCard>

      {activityImageUrls.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[16px] font-semibold text-[#757474]">활동 사진</p>
          <div className="scrollbar-hide flex gap-2.5 overflow-x-auto">
            {activityImageUrls.map((url, index) => (
              <button
                key={url}
                type="button"
                aria-label={`활동 사진 ${index + 1} 확대`}
                onClick={() => setSelectedImageIndex(index)}
                className="shrink-0 active:opacity-70"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  width={150}
                  height={106}
                  className="h-[106px] w-[150px] rounded-xl bg-white object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <ImageViewerModal
        imageUrls={activityImageUrls}
        initialIndex={selectedImageIndex ?? 0}
        visible={selectedImageIndex !== null}
        onClose={() => setSelectedImageIndex(null)}
      />
    </div>
  )
}

// 상세설명: 115px 넘게 길면 접어두고 그라데이션(28px) + 화살표 토글 (앱과 동일)
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
      <p className={LABEL_CLASS}>상세설명</p>
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
          className="-mt-2 flex min-h-[44px] items-center justify-center text-[#757474] active:opacity-50"
          aria-label={isExpanded ? '상세설명 접기' : '상세설명 펼치기'}
        >
          <MdiIcon name={isExpanded ? 'chevronUp' : 'chevronDown'} size={24} />
        </button>
      )}
    </div>
  )
}
