import { useMemo, useState } from 'react'
import type { RecruitmentContent } from '../../api.detail'
import { HtmlContent } from '../HtmlContent'
import { MdiIcon } from '../icons'
import { ImageViewerModal } from './ImageViewerModal'
import { BooleanPills, DetailTag, Pill } from './Pills'
import {
  formatRecruitmentDeadline,
  formatRegularMeeting,
  getRecruitmentApplicationUrl,
  getRecruitmentTextPreview,
  shouldStackActivityLocation,
  shouldStackRegularMeetings,
} from './recruitmentPresentation'

type Props = {
  content: RecruitmentContent
}

const LOCATION_TYPES = ['동방', '동방 외', '미정']

// 앱 FULL_TEXT_BASE_STYLE / bodyText: bodyMRegular 14/400, #757474, lineHeight 21
const BODY_TEXT_CLASS = 'text-[14px] font-normal leading-[21px] text-[#757474]'
const FIELD_LABEL_CLASS = 'text-[14px] font-normal text-[#BCBCBC]'

function BooleanDetailRow({
  label,
  active,
  detail,
  trueLabel,
  falseLabel,
  falseFirst,
}: {
  label: string
  active: boolean
  detail?: string
  trueLabel?: string
  falseLabel?: string
  falseFirst?: boolean
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <p className={FIELD_LABEL_CLASS}>{label}</p>
      <div className="flex flex-col items-start gap-2.5">
        <BooleanPills
          active={active}
          trueLabel={trueLabel}
          falseLabel={falseLabel}
          falseFirst={falseFirst}
        />
        {!!detail && <p className={`whitespace-pre-wrap ${BODY_TEXT_CLASS}`}>{detail}</p>}
      </div>
    </div>
  )
}

/**
 * 앱 ClubDetail/RecruitmentDetailCard.tsx 와 동일:
 * 제목/마감 → 공고 사진(가로 스크롤, 3장 이상이면 우측 페이드) →
 * 필참활동 여부 / 정기모임 일시 / 활동 장소 / 지원자격 / 모집인원 / 회비 / 가입절차 → 공고 본문(접기/펼치기)
 */
export function RecruitmentDetailCard({ content }: Props) {
  const [fullTextExpanded, setFullTextExpanded] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const meetingTags = content.regular_meetings.map(formatRegularMeeting)
  const stackMeetings = shouldStackRegularMeetings(meetingTags.length)
  const stackLocation = shouldStackActivityLocation(content.activity_location_text)
  const fullTextPreview = useMemo(
    () =>
      content.full_recruitment_text ? getRecruitmentTextPreview(content.full_recruitment_text) : '',
    [content.full_recruitment_text],
  )

  return (
    <div className="flex flex-col gap-[15px]">
      <div className="flex flex-col gap-1.5">
        <p className="text-[20px] font-bold text-[#757474]">{content.title}</p>
        <p className="text-[16px] font-semibold text-[#874FFF]">
          {formatRecruitmentDeadline(content.deadline)}
        </p>
      </div>

      {content.image_urls.length > 0 && (
        <div className="relative">
          <div className="scrollbar-hide flex gap-2.5 overflow-x-auto">
            {content.image_urls.map((url, index) => (
              <button
                key={url}
                type="button"
                aria-label={`공고 사진 ${index + 1} 확대`}
                onClick={() => setSelectedImageIndex(index)}
                className="shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  width={120}
                  height={120}
                  className="h-[120px] w-[120px] rounded-lg border border-[#C1C1C1] object-cover"
                />
              </button>
            ))}
          </div>
          {content.image_urls.length >= 3 && (
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-[50px]"
              style={{ background: 'linear-gradient(to right, rgba(255,255,255,0), #FFFFFF)' }}
            />
          )}
        </div>
      )}

      <div className="flex flex-col gap-[15px]">
        <BooleanDetailRow label="필참활동 여부" active={content.is_mandatory} />

        <div className="flex flex-col gap-[7px]">
          <p className={FIELD_LABEL_CLASS}>정기모임 일시</p>
          <div className="flex flex-wrap items-center gap-[7px]">
            <BooleanPills active={content.has_regular_meeting} />
            {!stackMeetings && meetingTags.map((tag) => <DetailTag key={tag} text={tag} />)}
          </div>
          {stackMeetings && (
            <div className="flex flex-wrap gap-[7px]">
              {meetingTags.map((tag) => (
                <DetailTag key={tag} text={tag} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[7px]">
          <p className={FIELD_LABEL_CLASS}>활동 장소</p>
          <div className="flex flex-wrap items-center gap-[7px]">
            <div className="flex gap-[7px]">
              {LOCATION_TYPES.map((type) => (
                <Pill key={type} label={type} selected={type === content.activity_location_type} />
              ))}
            </div>
            {!stackLocation && !!content.activity_location_text && (
              <DetailTag text={content.activity_location_text} />
            )}
          </div>
          {stackLocation && !!content.activity_location_text && (
            <div className="flex flex-col items-start">
              <DetailTag text={content.activity_location_text} />
            </div>
          )}
        </div>

        <BooleanDetailRow
          label="지원자격"
          active={content.has_eligibility}
          detail={content.eligibility_text || undefined}
        />
        <BooleanDetailRow
          label="모집인원"
          active={content.has_capacity_limit}
          trueLabel="정원 있음"
          falseLabel="제한 없음"
          falseFirst
          detail={content.capacity_limit_text || undefined}
        />
        <BooleanDetailRow
          label="회비"
          active={content.has_membership_fee}
          detail={content.membership_fee_text || undefined}
        />

        <div className="flex flex-col gap-[7px]">
          <p className={FIELD_LABEL_CLASS}>가입절차</p>
          <div className="flex flex-col items-start gap-2.5">
            {!!content.application_url && (
              <a
                href={getRecruitmentApplicationUrl(content.application_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-full truncate text-[14px] font-medium text-[#874FFF] underline active:opacity-50"
              >
                {content.application_url}
              </a>
            )}
            {!!content.application_process && (
              <p className={`whitespace-pre-wrap ${BODY_TEXT_CLASS}`}>
                {content.application_process}
              </p>
            )}
          </div>
        </div>
      </div>

      {!!content.full_recruitment_text && (
        <div className="flex flex-col gap-[7px]">
          <p className={FIELD_LABEL_CLASS}>공고 본문</p>
          <div className="flex flex-col gap-1">
            {fullTextExpanded ? (
              <HtmlContent
                html={content.full_recruitment_text}
                typographyClassName={BODY_TEXT_CLASS}
              />
            ) : (
              <p className={`line-clamp-2 ${BODY_TEXT_CLASS}`}>{fullTextPreview}</p>
            )}
            <button
              type="button"
              aria-label={fullTextExpanded ? '공고 본문 접기' : '공고 본문 펼치기'}
              aria-expanded={fullTextExpanded}
              onClick={() => setFullTextExpanded((previous) => !previous)}
              className="flex h-6 w-11 items-center justify-center self-center text-[#757474] active:opacity-50"
            >
              <MdiIcon name={fullTextExpanded ? 'chevronUp' : 'chevronDown'} size={14} />
            </button>
          </div>
        </div>
      )}

      <ImageViewerModal
        imageUrls={content.image_urls}
        initialIndex={selectedImageIndex ?? 0}
        visible={selectedImageIndex !== null}
        onClose={() => setSelectedImageIndex(null)}
      />
    </div>
  )
}
