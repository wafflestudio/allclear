import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import {
  isRejectedRequest,
  type ManagedClubListItem,
  useCancelManagedClubRequest,
  useManageClubs,
} from '../../../src/club/api/managers'
import {
  leaveAccount,
  useCreateUserVoice,
  useReadNotification,
  useUserNotifications,
} from '../../../src/club/api/users'
import { useProfile, useRequireLogin } from '../../../src/club/auth/AuthContext'
import { clearLoginToken } from '../../../src/club/auth/token'
import { ManageClubList } from '../../../src/club/features/mypage/ManageClubList'
import { ManageClubSheet } from '../../../src/club/features/mypage/ManageClubSheet'
import { RequestRemovalSuccessModal } from '../../../src/club/features/mypage/RequestRemovalSuccessModal'
import { UserVoiceSheet } from '../../../src/club/features/mypage/UserVoiceSheet'
import { AlertModal } from '../../../src/club/shared/components/AlertModal'
import { AppTabBar } from '../../../src/club/shared/components/AppTabBar'
import { EditPencilButton } from '../../../src/club/shared/components/EditPencilButton'
import { MdiIcon } from '../../../src/club/shared/components/icons'
import {
  getNotificationClub,
  getUserNotificationContent,
} from '../../../src/club/shared/utils/userNotification'
import { openAppDeepLink } from '../../../src/club/web/openInApp'

/**
 * 앱 MyPageScreen 과 동일: bg #F3F0F5, padding 16 (아래 32) gap 12
 * 프로필 카드 → 운영진 카드 → 관리 중인 동아리 가로 스크롤 → 메뉴 카드 → 계정 카드
 * + 로그아웃/탈퇴/신청 취소·삭제/알림 모달, 의견 보내기·동아리 등록 유형 바텀시트
 * 앱 전용 화면(공고 등록, 동아리 관리, 신청 수정·재신청, 신규 등록 플로우)은 앱으로 보낸다.
 */
const MyPage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isLoading, setUser, logout } = useProfile()
  const requireLogin = useRequireLogin()
  const isLoggedIn = !!user

  const [logoutModalVisible, setLogoutModalVisible] = useState(false)
  const [leaveModalVisible, setLeaveModalVisible] = useState(false)
  const [cancelRequestClub, setCancelRequestClub] = useState<ManagedClubListItem | null>(null)
  const [requestRemovalSuccess, setRequestRemovalSuccess] = useState<
    'cancelled' | 'deleted' | null
  >(null)
  const [isUserVoiceOpen, setIsUserVoiceOpen] = useState(false)
  const [isManageClubOpen, setIsManageClubOpen] = useState(false)

  const { data: manageClubsData } = useManageClubs(isLoggedIn)
  const { data: notificationData } = useUserNotifications(isLoggedIn)
  const readNotificationMutation = useReadNotification()
  const cancelRequestMutation = useCancelManagedClubRequest()
  const createUserVoiceMutation = useCreateUserVoice()

  // 앱은 탭 진입 자체를 로그인으로 게이트 — 웹은 비로그인 접근 시 로그인 시트 표시
  useEffect(() => {
    if (!isLoading && !user) {
      requireLogin(() => {})
    }
  }, [isLoading, user, requireLogin])

  const manageClubs = manageClubsData ?? []
  const currentNotification = notificationData?.notifications.find(
    (notification) => !notification.readAt,
  )
  const notificationModalContent = currentNotification
    ? getUserNotificationContent(currentNotification, manageClubs)
    : null
  const notificationActionDisabled =
    currentNotification?.type === 'MANAGER_REQUEST_REJECTED' &&
    getNotificationClub(currentNotification, manageClubs)?.hasManager === true

  // 앱: 탈퇴 API → 토큰/프로필/캐시 정리 → 홈 이동 → 토스트.
  // 웹은 마이페이지의 로그인 게이트가 다시 열리지 않도록 홈으로 먼저 이동한 뒤 상태를 비운다.
  const confirmLeave = async () => {
    try {
      await leaveAccount()
    } catch {
      toast.info('탈퇴 처리 중 오류가 발생했어요')
      return
    }
    await router.push('/club')
    clearLoginToken()
    setUser(null)
    queryClient.clear()
    toast.info('회원 탈퇴 되었어요!')
  }

  const confirmLogout = async () => {
    await router.push('/club')
    logout()
  }

  // 앱 UserVoiceView.handleSubmit: 시트를 먼저 닫고 전송, 1초 뒤 토스트
  const handleUserVoiceSubmit = (content: string) => {
    setIsUserVoiceOpen(false)
    createUserVoiceMutation
      .mutateAsync(content)
      .then(() => {
        setTimeout(() => {
          toast.info('의견이 전송되었어요!', { autoClose: 2000 })
        }, 1000)
      })
      .catch(() => {
        toast.info('이런! 문제가 생겼어요!', { autoClose: 2000 })
      })
  }

  // 아래 화면들은 앱에만 있다 (AnnouncementRegistration / ClubManagement / ManageClubRegistration / 등록 위저드)
  const handleRegisterAnnouncement = (_club: ManagedClubListItem) => openAppDeepLink()
  const handleManageClub = (_club: ManagedClubListItem) => openAppDeepLink()
  const handleEditRequest = (_club: ManagedClubListItem) => openAppDeepLink()
  const handleManageClubNext = () => openAppDeepLink()

  const handleCloseCancelRequestModal = () => {
    if (!cancelRequestMutation.isLoading) {
      setCancelRequestClub(null)
    }
  }

  const handleConfirmCancelRequest = () => {
    if (!cancelRequestClub || cancelRequestMutation.isLoading) return

    const club = cancelRequestClub
    cancelRequestMutation.mutate(club, {
      onSuccess: () => {
        setCancelRequestClub(null)
        setRequestRemovalSuccess(isRejectedRequest(club) ? 'deleted' : 'cancelled')
      },
      onError: () => {
        toast.error(
          <div>
            <p>
              {isRejectedRequest(club) ? '신청을 삭제하지 못했어요' : '신청을 취소하지 못했어요'}
            </p>
            <p className="text-[12px]">잠시 후 다시 시도해주세요</p>
          </div>,
        )
      },
    })
  }

  const handleReadCurrentNotification = () => {
    if (!currentNotification) return
    readNotificationMutation.mutate(currentNotification.id)
  }

  const handleCurrentNotificationAction = () => {
    if (!currentNotification) return

    handleReadCurrentNotification()
    if (
      (currentNotification.type === 'CLUB_REGISTRATION_REJECTED' ||
        currentNotification.type === 'MANAGER_REQUEST_REJECTED') &&
      currentNotification.clubId
    ) {
      // 앱: ManageClubRegistration(수정 및 재신청) 화면으로 이동 — 웹은 앱으로 보낸다
      openAppDeepLink()
    }
  }

  const collegeLine = user?.collegeMajor?.college
    ? user.collegeMajor.major
      ? `${user.collegeMajor.college} ${user.collegeMajor.major}`
      : user.collegeMajor.college
    : '단과대 정보가 없습니다'
  const admissionLine =
    user?.admissionClass != null
      ? `${String(user.admissionClass).padStart(2, '0')}학번`
      : '학번 정보가 없습니다'

  return (
    <>
      <Head>
        <title>마이페이지 - 서울대 모든 동아리 올클리어</title>
      </Head>

      <div className="min-h-screen bg-[#F3F0F5] font-pretendard leading-[normal] text-[#202020]">
        {/* 앱 scrollContent: padding 16, paddingBottom 32, gap 12 (+ 하단 탭바 86) */}
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col gap-3 p-4 pb-[118px]">
          {isLoading ? null : !user ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-white py-16">
              <p className="text-center text-[12px] font-normal leading-[18px] text-[#757474]">
                마이페이지를 보려면 로그인이 필요해요
              </p>
              <button
                type="button"
                onClick={() => requireLogin(() => {})}
                className="mt-3 text-[14px] font-semibold text-[#202020] underline active:opacity-40"
              >
                로그인 하러 가기
              </button>
            </div>
          ) : (
            <>
              {/* 프로필 카드 */}
              <div className="relative rounded-xl bg-white px-6 py-5">
                <div className="absolute right-5 top-5">
                  <EditPencilButton
                    ariaLabel="내 프로필 수정"
                    onClick={() => router.push('/club/mypage/edit')}
                  />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/mypage/club-management-snu-logo.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-contain"
                />
                <p className="mt-2.5 text-[20px] font-bold text-[#202020]">
                  {user.nickname || '이름 정보가 없습니다'}
                </p>
                <p className="mt-1.5 text-[14px] font-normal text-[#757474]">{collegeLine}</p>
                <p className="mt-1.5 text-[14px] font-normal text-[#757474]">{admissionLine}</p>
              </div>

              {/* 동아리 운영진이신가요? 카드 */}
              <button
                type="button"
                onClick={() => setIsManageClubOpen(true)}
                className="rounded-xl bg-[#FAFAFA] px-6 py-5 text-left active:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium tracking-[-0.28px] text-[#874FFF]">
                      동아리 운영진이신가요?
                    </p>
                    <p className="mt-1 text-[12px] font-normal leading-[18px] tracking-[-0.24px] text-[#874FFF] opacity-40">
                      신규 동아리 등록하기
                    </p>
                  </div>
                  <MdiIcon name="chevronRight" size={20} color="#874FFF" />
                </div>
              </button>

              {/* 관리 중인 동아리 가로 스크롤 */}
              {manageClubs.length > 0 && (
                <ManageClubList
                  clubs={manageClubs}
                  onRegisterAnnouncement={handleRegisterAnnouncement}
                  onManageClub={handleManageClub}
                  onCancelRequest={setCancelRequestClub}
                  onEditRequest={handleEditRequest}
                />
              )}

              {/* 기타 메뉴 */}
              <div className="rounded-xl bg-white px-6 py-5">
                <button
                  type="button"
                  onClick={() => setIsUserVoiceOpen(true)}
                  className="block w-full py-2.5 text-left text-[14px] font-normal text-[#757474] active:opacity-50"
                >
                  개발자에게 요청하기
                </button>
                <a
                  href="/terms/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2.5 text-[14px] font-normal text-[#757474] active:opacity-50"
                >
                  서비스 이용약관
                </a>
                <a
                  href="/terms/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2.5 text-[14px] font-normal text-[#757474] active:opacity-50"
                >
                  개인정보 처리방침
                </a>
              </div>

              {/* 계정 메뉴 */}
              <div className="rounded-xl bg-white px-6 py-5">
                <button
                  type="button"
                  onClick={() => setLogoutModalVisible(true)}
                  className="block w-full py-2.5 text-left text-[14px] font-normal text-[#757474] active:opacity-50"
                >
                  로그아웃
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveModalVisible(true)}
                  className="block w-full py-2.5 text-left text-[14px] font-normal text-[#757474] active:opacity-50"
                >
                  회원 탈퇴
                </button>
              </div>
            </>
          )}
        </div>

        <AppTabBar active="mypage" />
      </div>

      {isUserVoiceOpen && (
        <UserVoiceSheet
          onClose={() => setIsUserVoiceOpen(false)}
          onSubmit={handleUserVoiceSubmit}
        />
      )}
      {isManageClubOpen && (
        <ManageClubSheet onClose={() => setIsManageClubOpen(false)} onNext={handleManageClubNext} />
      )}

      {logoutModalVisible && (
        <AlertModal
          title="로그아웃"
          description="로그아웃 하시겠습니까?"
          buttonLabel="로그아웃"
          hasCancel
          onConfirm={() => {
            setLogoutModalVisible(false)
            confirmLogout()
          }}
          onCancel={() => setLogoutModalVisible(false)}
        />
      )}
      {leaveModalVisible && (
        <AlertModal
          title="회원 탈퇴"
          description="정말로 탈퇴하시겠습니까?"
          buttonLabel="탈퇴"
          buttonVariant="destructive"
          hasCancel
          onConfirm={() => {
            setLeaveModalVisible(false)
            confirmLeave()
          }}
          onCancel={() => setLeaveModalVisible(false)}
        />
      )}
      {cancelRequestClub && (
        <AlertModal
          title={
            isRejectedRequest(cancelRequestClub)
              ? '신청을 삭제하시겠어요?'
              : '신청을 취소하시겠어요?'
          }
          description={
            isRejectedRequest(cancelRequestClub)
              ? '삭제한 신청은 복구할 수 없어요.'
              : '취소한 신청은 복구할 수 없어요.'
          }
          buttonLabel={isRejectedRequest(cancelRequestClub) ? '삭제' : '신청 취소'}
          buttonVariant="destructive"
          hasCancel
          cancelLabel="돌아가기"
          dismissOnBackdropPress={!cancelRequestMutation.isLoading}
          onConfirm={handleConfirmCancelRequest}
          onCancel={handleCloseCancelRequestModal}
        />
      )}
      {requestRemovalSuccess !== null && (
        <RequestRemovalSuccessModal
          message={
            requestRemovalSuccess === 'deleted' ? '신청이 삭제되었어요.' : '신청이 취소되었어요.'
          }
          onClose={() => setRequestRemovalSuccess(null)}
        />
      )}
      {currentNotification && notificationModalContent && (
        <AlertModal
          title={notificationModalContent.title}
          description={notificationModalContent.description}
          buttonLabel={notificationModalContent.buttonLabel}
          buttonDisabled={notificationActionDisabled}
          hasCancel={notificationModalContent.hasCancel}
          cancelLabel={notificationModalContent.cancelLabel}
          dismissOnBackdropPress={false}
          onConfirm={handleCurrentNotificationAction}
          onCancel={handleReadCurrentNotification}
        />
      )}
    </>
  )
}

export default MyPage
