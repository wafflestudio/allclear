import type { ManagedClubListItem, ManagedClubManagementStatus } from '../../api.mypage'
import { getClubSummaryWithAffiliation } from './clubSummary'

type Props = {
  clubs: ManagedClubListItem[]
  onRegisterAnnouncement: (club: ManagedClubListItem) => void
  onManageClub: (club: ManagedClubListItem) => void
  onCancelRequest: (club: ManagedClubListItem) => void
  onEditRequest: (club: ManagedClubListItem) => void
}

type ManagedClubOverlayStatus = Exclude<ManagedClubManagementStatus, 'APPROVED'>

// 앱 MyPageScreen MANAGE_CLUB_STATUS_OVERLAY 와 동일
const MANAGE_CLUB_STATUS_OVERLAY: Record<
  ManagedClubOverlayStatus,
  { label: string; backgroundColor: string }
> = {
  PENDING: { label: '승인 대기 중', backgroundColor: 'rgba(135, 79, 255, 0.2)' },
  REJECTED: { label: '미승인(신청 반려)', backgroundColor: 'rgba(0, 0, 0, 0.2)' },
  MANAGER_REQUEST_PENDING: {
    label: '운영진 권한 승인 대기 중',
    backgroundColor: 'rgba(135, 79, 255, 0.2)',
  },
  MANAGER_REQUEST_REJECTED: {
    label: '미승인(운영진 권한 신청 반려)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
}

// 앱 버튼 텍스트는 "Apple SD Gothic Neo" 600 14/lh24 ls -0.28
const BUTTON_FONT = "font-['Apple_SD_Gothic_Neo',Pretendard,sans-serif]"
const OUTLINE_BUTTON = `flex h-[35px] flex-1 items-center justify-center rounded-lg border border-[#874FFF] text-center text-[14px] font-semibold leading-6 tracking-[-0.28px] text-[#874FFF] active:opacity-70 ${BUTTON_FONT}`
const FILLED_BUTTON = `flex h-[35px] flex-1 items-center justify-center rounded-lg bg-[#874FFF] text-center text-[14px] font-semibold leading-6 tracking-[-0.28px] text-white active:opacity-70 ${BUTTON_FONT}`
const DISABLED_BUTTON = `flex h-[35px] flex-1 items-center justify-center rounded-lg bg-[#EAEAEA] text-center text-[14px] font-semibold leading-6 tracking-[-0.28px] text-[#C1C1C1] ${BUTTON_FONT}`

/**
 * 앱 MyPageScreen "관리 중인 동아리 가로 스크롤" 과 동일:
 * 아이템 너비 330, 아이템 간 10, 카드(높이 120, bg #FAFAFA, radius 10, 썸네일 75, 이름 17/700, 요약 13/400)
 * + 상태 오버레이(블러 + 색 + 가운데 라벨 14/700 #874FFF) + 상태별 버튼 행(높이 35, gap 10)
 */
export function ManageClubList({
  clubs,
  onRegisterAnnouncement,
  onManageClub,
  onCancelRequest,
  onEditRequest,
}: Props) {
  return (
    <div className="scrollbar-hide flex gap-2.5 overflow-x-auto pr-1">
      {clubs.map((club) => (
        <div key={club.uuid} className="flex w-[330px] shrink-0 flex-col gap-2.5">
          {/* 동아리 정보 카드 */}
          <div className="relative h-[120px]">
            <div className="flex h-full items-center gap-[30px] overflow-hidden rounded-[10px] bg-[#FAFAFA] py-5 pl-[30px] pr-5">
              <div className="h-[75px] w-[75px] shrink-0 overflow-hidden rounded-[10px] bg-[#D9D9D9]">
                {club.imageUri ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={club.imageUri} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <p className="truncate text-[17px] font-bold leading-6 tracking-[-0.34px] text-[#202020]">
                  {club.name}
                </p>
                <div className="flex flex-col gap-[5px]">
                  <p className="truncate text-[13px] font-normal leading-[15px] tracking-[-0.26px] text-[#757474]">
                    {getClubSummaryWithAffiliation(club)}
                  </p>
                </div>
              </div>
              <ManageClubStatusBlurLayer status={club.managementStatus} />
            </div>
            <ManageClubStatusTextLayer status={club.managementStatus} />
          </div>

          <ManageClubButtons
            club={club}
            onRegisterAnnouncement={onRegisterAnnouncement}
            onManageClub={onManageClub}
            onCancelRequest={onCancelRequest}
            onEditRequest={onEditRequest}
          />
        </div>
      ))}
    </div>
  )
}

function ManageClubStatusBlurLayer({ status }: { status: ManagedClubManagementStatus }) {
  if (status === 'APPROVED') return null

  const overlay = MANAGE_CLUB_STATUS_OVERLAY[status]

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      {/* 앱 BlurView(light, blurAmount 1) */}
      <div className="absolute inset-0 backdrop-blur-[1px]" />
      <div className="absolute inset-0" style={{ backgroundColor: overlay.backgroundColor }} />
    </div>
  )
}

function ManageClubStatusTextLayer({ status }: { status: ManagedClubManagementStatus }) {
  if (status === 'APPROVED') return null

  const overlay = MANAGE_CLUB_STATUS_OVERLAY[status]

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
      <p className="text-center text-[14px] font-bold leading-6 tracking-[-0.28px] text-[#874FFF]">
        {overlay.label}
      </p>
    </div>
  )
}

function ManageClubButtons({
  club,
  onRegisterAnnouncement,
  onManageClub,
  onCancelRequest,
  onEditRequest,
}: { club: ManagedClubListItem } & Omit<Props, 'clubs'>) {
  if (club.managementStatus === 'APPROVED') {
    return (
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className={OUTLINE_BUTTON}
          onClick={() => onRegisterAnnouncement(club)}
        >
          공고 등록
        </button>
        <button type="button" className={FILLED_BUTTON} onClick={() => onManageClub(club)}>
          동아리 관리
        </button>
      </div>
    )
  }

  if (
    club.managementStatus === 'REJECTED' ||
    club.managementStatus === 'MANAGER_REQUEST_REJECTED'
  ) {
    // 이미 다른 운영진이 승인된 동아리면 재신청 불가
    const isResubmissionDisabled =
      club.managementStatus === 'MANAGER_REQUEST_REJECTED' && club.hasManager

    return (
      <div className="flex items-center gap-2.5">
        <button type="button" className={OUTLINE_BUTTON} onClick={() => onCancelRequest(club)}>
          삭제
        </button>
        <button
          type="button"
          className={isResubmissionDisabled ? DISABLED_BUTTON : FILLED_BUTTON}
          disabled={isResubmissionDisabled}
          onClick={() => onEditRequest(club)}
        >
          수정 및 재신청
        </button>
      </div>
    )
  }

  if (club.managementStatus === 'PENDING' || club.managementStatus === 'MANAGER_REQUEST_PENDING') {
    return (
      <div className="flex items-center gap-2.5">
        <button type="button" className={OUTLINE_BUTTON} onClick={() => onCancelRequest(club)}>
          신청 취소
        </button>
        <button type="button" className={FILLED_BUTTON} onClick={() => onEditRequest(club)}>
          신청 내용 수정
        </button>
      </div>
    )
  }

  return null
}
