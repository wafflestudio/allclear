import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { useClub, useReviewKeywordCategories } from '../../../src/club/api'
import { useProfile, useRequireLogin } from '../../../src/club/auth/AuthContext'
import { authFetch } from '../../../src/club/auth/token'
import { BackHeader } from '../../../src/club/components/BackHeader'
import { BackgroundCard } from '../../../src/club/components/BackgroundCard'

type MyReview = {
  rating: number
  reviewKeywordIds: string[]
  content: string
  createdAt: string
  updatedAt: string
}

// 앱 ClubReviewScreen과 동일: 키워드 칩 2열 다중 선택 + 저장하기
const ClubReviewPage = () => {
  const router = useRouter()
  const uuid = typeof router.query.uuid === 'string' ? router.query.uuid : undefined
  const queryClient = useQueryClient()
  const { user, isLoading: isProfileLoading } = useProfile()
  const requireLogin = useRequireLogin()

  const { data: club, isLoading: isClubLoading } = useClub(uuid)
  const { data: categories } = useReviewKeywordCategories()
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<string[]>([])

  useEffect(() => {
    if (!isProfileLoading && !user) {
      requireLogin(() => {})
    }
  }, [isProfileLoading, user, requireLogin])

  // 기존 내 후기가 있으면 미리 선택 (앱과 동일)
  const { data: myReviewIds } = useQuery(
    ['myClubReview', uuid],
    () =>
      authFetch<MyReview | null>(`/api/v2/clubs/${uuid}/reviews/me`).then(
        (res) => res?.reviewKeywordIds,
      ),
    { enabled: !!uuid && !!user },
  )

  useEffect(() => {
    if (myReviewIds) setSelectedKeywordIds(myReviewIds)
  }, [myReviewIds])

  const submitMutation = useMutation(
    () =>
      authFetch<void>(`/api/v2/clubs/${uuid}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewKeywordIds: selectedKeywordIds }),
      }),
    {
      onSuccess: () => {
        toast.info('🎉  리뷰가 저장되었어요')
        queryClient.invalidateQueries()
        router.back()
      },
    },
  )

  const toggleKeyword = (id: string) => {
    setSelectedKeywordIds((prev) =>
      prev.includes(id) ? prev.filter((it) => it !== id) : [...prev, id],
    )
  }

  const isSubmitDisabled = submitMutation.isLoading || selectedKeywordIds.length === 0

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
            <div className="px-4 py-4">
              <BackgroundCard>
                <h1 className="mb-5 text-[20px] font-bold text-[#202020]">
                  {club.name} 에서의 경험을 공유해주세요 😀
                </h1>

                {(categories ?? []).map((category, index) => (
                  <div
                    key={category.id}
                    className={`mt-4 ${index > 0 ? 'border-t border-[#EAEAEA] pt-4' : ''}`}
                  >
                    <p className="mb-3 text-[16px] font-semibold text-[#202020]">
                      {category.title}
                    </p>
                    <div className="mt-2 flex flex-wrap justify-between gap-y-2">
                      {category.keywords.map((keyword) => {
                        const isSelected = selectedKeywordIds.includes(keyword.id)
                        return (
                          <button
                            key={keyword.id}
                            type="button"
                            onClick={() => toggleKeyword(keyword.id)}
                            className={`flex w-[48%] items-center justify-center rounded-[32px] border px-3 py-2.5 ${
                              isSelected
                                ? 'border-[#874FFF] bg-[#874FFF]'
                                : 'border-[#C1C1C1] bg-white'
                            }`}
                          >
                            <span className="mr-1 text-[14px]">{keyword.iconUri?.trim()}</span>
                            <span
                              className={`text-[14px] ${
                                isSelected
                                  ? 'font-semibold text-white'
                                  : 'font-normal text-[#202020]'
                              }`}
                            >
                              {keyword.title}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="mt-6 flex">
                  <button
                    type="button"
                    disabled={isSubmitDisabled}
                    onClick={() => submitMutation.mutate()}
                    className={`flex-1 rounded-lg px-[50px] py-3.5 text-[16px] font-semibold leading-5 ${
                      isSubmitDisabled
                        ? 'bg-[#EAEAEA] text-[#C1C1C1]'
                        : 'bg-[#874FFF] text-white active:bg-[#4F2E94]'
                    }`}
                  >
                    저장하기
                  </button>
                </div>
              </BackgroundCard>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ClubReviewPage
