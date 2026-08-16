import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useClub, useReviewKeywordCategories } from '../../../src/club/api'
import { useCreateClubReview, useMyClubReview } from '../../../src/club/api.detail'
import { useProfile, useRequireLogin } from '../../../src/club/auth/AuthContext'
import { BackgroundCard } from '../../../src/club/components/BackgroundCard'
import { BackHeader } from '../../../src/club/components/BackHeader'

// 앱 reviewCard: padding 20, radius 15, 그림자 (0,1) 5% blur 5
const REVIEW_CARD_STYLE = {
  padding: 20,
  borderRadius: 15,
  boxShadow: '0 1px 5px rgba(0,0,0,0.05)',
} as const

/**
 * 앱 ClubReviewScreen 과 동일:
 * "동아리명 에서의 경험을 공유해주세요" + 참여 인원 → 카테고리별 키워드 2열(다중 선택) → 저장하기(164×35).
 * 기존에 남긴 후기가 있으면 미리 선택되고, 저장 시 토스트 후 뒤로 간다.
 */
const ClubReviewPage = () => {
  const router = useRouter()
  const uuid = typeof router.query.uuid === 'string' ? router.query.uuid : undefined
  const { user, isLoading: isProfileLoading } = useProfile()
  const requireLogin = useRequireLogin()

  const { data: club, isLoading: isClubLoading } = useClub(uuid)
  const { data: reviewKeywordCategories } = useReviewKeywordCategories()
  const { data: myClubReviewIds } = useMyClubReview(uuid, !!user)
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<string[]>([])

  // 앱은 requireLogin 을 통과해야만 이 화면에 들어온다 — 웹은 비로그인 직접 진입 시 로그인 시트를 띄운다
  useEffect(() => {
    if (!isProfileLoading && !user) {
      requireLogin(() => {})
    }
  }, [isProfileLoading, user, requireLogin])

  useEffect(() => {
    if (!myClubReviewIds) return
    setSelectedKeywordIds(myClubReviewIds)
  }, [myClubReviewIds])

  const { mutate, isLoading: isSubmitting } = useCreateClubReview(uuid, () => {
    toast.info('🎉  리뷰가 저장되었어요')
    router.back()
  })

  const handleKeywordPress = (keywordId: string) => {
    setSelectedKeywordIds((currentIds) =>
      currentIds.includes(keywordId)
        ? currentIds.filter((id) => id !== keywordId)
        : [...currentIds, keywordId],
    )
  }

  const handleSaveReview = () => {
    mutate(selectedKeywordIds)
  }

  const isSubmitDisabled = isSubmitting || selectedKeywordIds.length === 0

  return (
    <>
      <Head>
        <title>활동 후기 남기기 - 서울대 모든 동아리 올클리어</title>
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] font-pretendard text-[#202020]">
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col">
          <BackHeader title="활동 후기 남기기" onBack={() => router.back()} />

          {isClubLoading || !club ? (
            <div className="flex flex-1 items-start justify-center pt-[30vh]">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#874FFF] border-t-transparent" />
            </div>
          ) : (
            <div className="px-[15px] pb-6 pt-[13px]">
              <BackgroundCard style={REVIEW_CARD_STYLE}>
                <div className="mb-[25px] flex flex-col gap-[3px]">
                  <h1 className="text-[16px] font-semibold text-[#757474]">
                    <span className="text-[#874FFF]">{club.name}</span>
                    {' 에서의 경험을 공유해주세요'}
                  </h1>
                  <p className="text-[11px] font-medium leading-[14px] text-[#757474]">
                    현재까지 {club.totalReviews}명이 참여했어요
                  </p>
                </div>

                <div className="flex flex-col gap-[25px]">
                  {reviewKeywordCategories?.map((kc) => {
                    const columnBreak = Math.ceil(kc.keywords.length / 2)
                    const keywordColumns = [
                      kc.keywords.slice(0, columnBreak),
                      kc.keywords.slice(columnBreak),
                    ].filter((column) => column.length > 0)

                    return (
                      <div key={kc.id}>
                        <p className="mb-2.5 text-[14px] font-medium text-[#757474]">{kc.title}</p>
                        <div className="flex items-start justify-between">
                          {keywordColumns.map((column) => (
                            <div key={column[0].id} className="flex flex-col items-start gap-2">
                              {column.map((keyword) => {
                                const isSelected = selectedKeywordIds.includes(keyword.id)

                                return (
                                  <button
                                    key={keyword.id}
                                    type="button"
                                    role="checkbox"
                                    aria-checked={isSelected}
                                    onClick={() => handleKeywordPress(keyword.id)}
                                    className={`flex items-center justify-center rounded-[20px] border-[0.3px] border-[#874FFF] px-2.5 pb-2 pt-[7px] active:opacity-40 ${
                                      isSelected ? 'bg-[#874FFF]' : 'bg-white'
                                    }`}
                                  >
                                    <span className="mr-0.5 text-[12px] font-normal leading-[12px]">
                                      {keyword.iconUri?.trim()}
                                    </span>
                                    <span
                                      className={`text-[12px] font-normal leading-[12px] ${
                                        isSelected ? 'text-white' : 'text-[#757474]'
                                      }`}
                                    >
                                      {keyword.title}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </BackgroundCard>

              <div className="mt-7 flex justify-center">
                <button
                  type="button"
                  disabled={isSubmitDisabled}
                  onClick={handleSaveReview}
                  className={`flex h-[35px] w-[164px] items-center justify-center rounded-lg text-[14px] font-semibold text-white ${
                    isSubmitDisabled ? 'bg-[#C1C1C1]' : 'bg-[#874FFF] active:bg-[#4F2E94]'
                  }`}
                >
                  저장하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ClubReviewPage
