import { useState } from 'react'
import { AlertModal } from '../AlertModal'
import { BottomSheet } from './BottomSheet'

export type ManageClubOption = 'campus' | 'external' | 'existing'

type Props = {
  onClose: () => void
  /** 앱: "교내 동아리" → 등록 위저드, "이미 있는 동아리 운영진 등록" → ManageClubRegistration (둘 다 앱 전용 화면) */
  onNext: (option: Exclude<ManageClubOption, 'external'>) => void
}

const OPTIONS: { id: ManageClubOption; label: string }[] = [
  { id: 'campus', label: '교내 동아리' },
  { id: 'external', label: '교외 동아리' },
  { id: 'existing', label: '이미 있는 동아리 운영진 등록' },
]

/**
 * 앱 shared/components/ManageClubView(+ manageClubBottomSheet, 스냅 370, 핸들 없음, radius 12)와 동일:
 * px 20 / pt 30 / pb 50, 타이틀 18/600/lh24(padding 10, 아래 10),
 * 옵션 버튼(높이 56, px 20, radius 8, 아래 10; 미선택 #C1C1C1 테두리·글자, 선택 bg #EAEAEA·글자 #757474, 16/500/lh24),
 * "다음"(높이 44, radius 8, bg #874FFF, 16/600/lh20; 미선택 시 bg #EAEAEA·글자 #C1C1C1).
 * "교외 동아리"는 안내 모달(교내 동아리 대상 서비스) 후 시트를 닫는다.
 */
export function ManageClubSheet({ onClose, onNext }: Props) {
  const [selectedOption, setSelectedOption] = useState<ManageClubOption | ''>('')
  const [isCampusOnlyModalVisible, setIsCampusOnlyModalVisible] = useState(false)

  const isSelectionValid = selectedOption.length > 0

  const handleSelectionNext = () => {
    if (selectedOption === '') return
    if (selectedOption === 'external') {
      setIsCampusOnlyModalVisible(true)
      return
    }
    onClose()
    onNext(selectedOption)
  }

  const handleCampusOnlyConfirm = () => {
    setIsCampusOnlyModalVisible(false)
    onClose()
  }

  return (
    <>
      <BottomSheet
        onClose={onClose}
        showHandle={false}
        radius={12}
        panelClassName="h-[370px]"
        ariaLabel="동아리 등록 유형 선택"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-[50px] pt-[30px]">
          <p className="mb-2.5 p-2.5 text-[18px] font-semibold leading-6 text-[#202020]">
            등록할 동아리의 유형을 선택해주세요
          </p>

          {OPTIONS.map((option) => {
            const isSelected = selectedOption === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedOption(option.id)}
                className={`mb-2.5 flex h-14 shrink-0 items-center rounded-lg px-5 text-left active:opacity-70 ${
                  isSelected ? 'bg-[#EAEAEA]' : 'border border-[#C1C1C1] bg-white'
                }`}
              >
                <span
                  className={`w-full text-left text-[16px] font-medium leading-6 ${
                    isSelected ? 'text-[#757474]' : 'text-[#C1C1C1]'
                  }`}
                >
                  {option.label}
                </span>
              </button>
            )
          })}

          <button
            type="button"
            disabled={!isSelectionValid}
            onClick={handleSelectionNext}
            className={`flex h-11 w-full shrink-0 items-center justify-center rounded-lg px-[50px] py-3 text-[16px] font-semibold leading-5 ${
              isSelectionValid
                ? 'bg-[#874FFF] text-white active:opacity-70'
                : 'bg-[#EAEAEA] text-[#C1C1C1]'
            }`}
          >
            다음
          </button>
        </div>
      </BottomSheet>

      {isCampusOnlyModalVisible && (
        <AlertModal
          title={'현재 올클 서비스는 교내 동아리\n대상으로만 제공되고 있어요'}
          description="확장 운영을 위해서 더 노력하는 올클이 될게요"
          buttonLabel="확인"
          onConfirm={handleCampusOnlyConfirm}
          onCancel={() => setIsCampusOnlyModalVisible(false)}
          dismissOnBackdropPress={false}
        />
      )}
    </>
  )
}
