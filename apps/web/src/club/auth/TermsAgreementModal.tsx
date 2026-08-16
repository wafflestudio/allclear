import { useMemo, useState } from 'react'
import { BackHeader } from '../components/BackHeader'
import { MdiIcon } from '../components/icons'
import { AppButton } from '../components/mypage/AppButton'
import { Checkbox } from '../components/mypage/Checkbox'
import type { Term } from './usePendingTerms'

type Props = {
  terms: Term[]
  isSubmitting: boolean
  onAgree: (termUuids: Term['uuid'][]) => void
}

/**
 * 앱 shared/components/TermsAgreementModal 과 동일:
 * 딤(0.2)+blur, 닫을 수 없는 카드(radius 28, px 24, pt 20, pb 24, gap 24, 높이 min(500, 화면-40))
 * 배지 "약관 동의" → 타이틀 25/700/lh30 + 부제 14/400 → 약관 목록(높이 190, 행 사이 구분선)
 * → "전체 동의" → "동의하고 계속하기"(너비 244, radius 16). 필수 약관 라벨은 #E53935.
 */
export function TermsAgreementModal({ terms, isSubmitting, onAgree }: Props) {
  const [checkedTermUuids, setCheckedTermUuids] = useState<Term['uuid'][]>([])
  const [viewingTerm, setViewingTerm] = useState<Term | null>(null)

  const mandatoryTermUuids = useMemo(
    () => terms.filter((term) => term.isMandatory).map((term) => term.uuid),
    [terms],
  )
  const allTermUuids = useMemo(() => terms.map((term) => term.uuid), [terms])
  const isAllChecked = allTermUuids.length > 0 && checkedTermUuids.length === allTermUuids.length
  const isAgreeButtonEnabled =
    terms.length > 0 && mandatoryTermUuids.every((uuid) => checkedTermUuids.includes(uuid))

  const handleToggleTerm = (termUuid: Term['uuid']) => {
    setCheckedTermUuids((prev) =>
      prev.includes(termUuid) ? prev.filter((uuid) => uuid !== termUuid) : [...prev, termUuid],
    )
  }

  const handleToggleAll = () => {
    setCheckedTermUuids(isAllChecked ? [] : allTermUuids)
  }

  const handleAgree = () => {
    if (!isAgreeButtonEnabled || isSubmitting) return
    onAgree(checkedTermUuids)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5 font-pretendard">
      {/* 앱: 백드롭 Pressable에 onPress 없음 → 탭해도 닫히지 않는다 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="약관 동의"
        className="relative flex w-full max-w-[440px] flex-col gap-6 rounded-[28px] bg-white px-6 pb-6 pt-5"
        style={{ height: 'min(500px, calc(100dvh - 40px))' }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="flex items-center">
            <span className="rounded-full bg-[rgba(135,79,255,0.1)] px-2.5 py-1.5 text-[10px] font-semibold leading-[14px] text-[#874FFF]">
              약관 동의
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[25px] font-bold leading-[30px] text-[#202020]">
              약관 동의가 필요해요
            </p>
            <p className="text-[14px] font-normal text-[#757474]">
              서비스 이용을 계속하려면 아래 약관에 동의해 주세요.
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="scrollbar-hide h-[190px] shrink-0 overflow-y-auto">
              {terms.map((term, index) => (
                <div
                  key={term.uuid}
                  className={`flex items-center justify-between ${
                    index < terms.length - 1 ? 'border-b border-[#EAEAEA]' : ''
                  }`}
                >
                  <Checkbox
                    label={`${term.isMandatory ? '[필수]' : '[선택]'} ${term.title}`}
                    checked={checkedTermUuids.includes(term.uuid)}
                    onToggle={() => handleToggleTerm(term.uuid)}
                    className="min-w-0 flex-1"
                    labelClassName={`text-[12px] font-medium ${
                      term.isMandatory ? 'text-[#E53935]' : 'text-[#202020]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setViewingTerm(term)}
                    className="flex shrink-0 items-center active:opacity-70"
                  >
                    <span className="text-[12px] font-medium text-[#757474]">보기</span>
                    <MdiIcon name="chevronRight" size={18} color="#757474" />
                  </button>
                </div>
              ))}
            </div>

            <Checkbox
              label="전체 동의"
              checked={isAllChecked}
              onToggle={handleToggleAll}
              className="self-start"
              labelClassName="text-[12px] font-medium text-[#874FFF]"
            />
          </div>
        </div>

        <div className="flex items-center justify-center">
          <AppButton
            label="동의하고 계속하기"
            onClick={handleAgree}
            disabled={!isAgreeButtonEnabled || isSubmitting}
            width={244}
            borderRadius={16}
          />
        </div>
      </div>

      {/* 앱: 약관 "보기" → 전체 화면 Modal(BackHeader + WebView) */}
      {viewingTerm && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
          <BackHeader title={viewingTerm.title} onBack={() => setViewingTerm(null)} />
          <iframe
            title={viewingTerm.title}
            src={viewingTerm.contentUrl}
            className="w-full flex-1"
          />
        </div>
      )}
    </div>
  )
}
