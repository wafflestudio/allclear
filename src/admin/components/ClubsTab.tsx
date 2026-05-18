import React, { useState } from 'react'
import { useClubDetail } from 'src/admin/hooks'
import { formatDate, statusLabels } from 'src/admin/constants'
import type { AdminClub, AdminClubDetail, DecisionStatus } from 'src/admin/types'
import { DetailItem, ErrorState, LoadingRows, EmptyState, StatusBadge } from './ui'

export const ClubsTab = ({
  clubs,
  isLoading,
  error,
  isMutating,
  onDecide,
}: {
  clubs: AdminClub[]
  isLoading: boolean
  error: unknown
  isMutating: boolean
  onDecide: (payload: {
    uuid: string
    status: DecisionStatus
    reject_reason?: string
    is_official_verified: boolean
  }) => void
}) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null)
  const detailQuery = useClubDetail(selectedUuid)

  return (
    <>
      <ClubList clubs={clubs} isLoading={isLoading} error={error} onOpenDetail={setSelectedUuid} />
      {selectedUuid && (
        <ClubDetailDialog
          detail={detailQuery.data?.data}
          isLoading={detailQuery.isLoading}
          error={detailQuery.error}
          isMutating={isMutating}
          onClose={() => setSelectedUuid(null)}
          onDecide={onDecide}
        />
      )}
    </>
  )
}

const ClubList = ({
  clubs,
  isLoading,
  error,
  onOpenDetail,
}: {
  clubs: AdminClub[]
  isLoading: boolean
  error: unknown
  onOpenDetail: (uuid: string) => void
}) => {
  if (isLoading) return <LoadingRows />
  if (error) return <ErrorState error={error} />
  if (!clubs.length) return <EmptyState title="조건에 맞는 동아리 신청이 없습니다." />

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_96px] gap-4 border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500 max-md:hidden">
        <span>동아리</span>
        <span>상태</span>
        <span>카테고리</span>
        <span>신청자</span>
        <span>검토</span>
      </div>
      {clubs.map((club) => (
        <article
          key={club.uuid}
          className="grid gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr_96px] md:items-center"
        >
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold">{club.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {club.affiliation} · {club.short_description}
            </p>
            <p className="mt-2 text-xs text-slate-400">{formatDate(club.created_at)}</p>
          </div>
          <StatusBadge status={club.status} />
          <p className="text-sm font-medium text-slate-700">{club.category}</p>
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{club.manager.name}</p>
            <p>{club.manager.phone}</p>
            <p>{club.manager.student_id}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenDetail(club.uuid)}
            className="min-h-[38px] rounded-md border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-100"
          >
            상세
          </button>
        </article>
      ))}
    </div>
  )
}

const ClubDetailDialog = ({
  detail,
  isLoading,
  error,
  isMutating,
  onClose,
  onDecide,
}: {
  detail?: AdminClubDetail
  isLoading: boolean
  error: unknown
  isMutating: boolean
  onClose: () => void
  onDecide: (payload: {
    uuid: string
    status: DecisionStatus
    reject_reason?: string
    is_official_verified: boolean
  }) => void
}) => {
  const [officialVerified, setOfficialVerified] = useState(true)
  const [rejectReason, setRejectReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="max-h-full w-full max-w-4xl overflow-y-auto rounded-md bg-white shadow-xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-medium text-slate-500">동아리 상세 검토</p>
            <h2 className="text-xl font-bold">{detail?.club_data.name ?? '불러오는 중'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-md border border-slate-200 text-lg font-bold hover:bg-slate-100"
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        <div className="p-5">
          {isLoading && <LoadingRows />}
          {Boolean(error) && <ErrorState error={error} />}
          {detail && (
            <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
              <div>
                <img
                  src={detail.club_data.image_uri || '/images/share-logo.png'}
                  alt={`${detail.club_data.name} 대표 이미지`}
                  className="mb-5 aspect-[16/9] w-full rounded-md border border-slate-200 object-cover"
                />
                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailItem label="상태" value={statusLabels[detail.club_data.status]} />
                  <DetailItem label="유형" value={detail.club_data.type} />
                  <DetailItem label="카테고리" value={detail.club_data.category} />
                  <DetailItem label="소속" value={detail.club_data.affiliation} />
                  <DetailItem label="한줄소개" value={detail.club_data.short_description} wide />
                  <DetailItem label="모집 형태" value={detail.club_data.recruit_type ?? '-'} />
                  <DetailItem
                    label="최소 활동 기간"
                    value={`${detail.club_data.min_activity_period}학기`}
                  />
                  <DetailItem
                    label="동방"
                    value={
                      detail.club_data.has_dongbang
                        ? detail.club_data.dongbang_location || '있음'
                        : '없음'
                    }
                  />
                  <DetailItem label="SNS" value={detail.club_data.sns || '-'} wide />
                  <DetailItem label="소개" value={detail.club_data.introduction ?? '-'} wide />
                </dl>
              </div>

              <aside className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-base font-bold">신청자</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-950">이름</span>{' '}
                    {detail.manager_data.name}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">연락처</span>{' '}
                    {detail.manager_data.phone}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">학번</span>{' '}
                    {detail.manager_data.student_id}
                  </p>
                  <p className="break-all text-xs text-slate-500">
                    {detail.manager_data.service_user_id}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={officialVerified}
                      onChange={(event) => setOfficialVerified(event.target.checked)}
                      className="h-4 w-4"
                    />
                    승인 시 공식 인증 부여
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    className="mt-3 min-h-[92px] w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600"
                    placeholder="반려 사유"
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() =>
                        onDecide({
                          uuid: detail.club_data.uuid,
                          status: 'REJECTED',
                          reject_reason: rejectReason,
                          is_official_verified: false,
                        })
                      }
                      className="min-h-[40px] rounded-md border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 disabled:opacity-50"
                    >
                      반려
                    </button>
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() =>
                        onDecide({
                          uuid: detail.club_data.uuid,
                          status: 'APPROVED',
                          is_official_verified: officialVerified,
                        })
                      }
                      className="min-h-[40px] rounded-md bg-slate-950 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      승인
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
