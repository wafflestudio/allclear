import React, { useState } from 'react'
import { formatDate } from 'src/admin/constants'
import type { AdminClub, AdminClubDetail, ClubStatus } from 'src/admin/types'
import { ClubDetailModal, EmptyState, ErrorState, LoadingRows, StatusBadge } from './ui'

type DecidePayload = {
  uuid: string
  status: ClubStatus
  reject_reason?: string
  is_official_verified: boolean
}

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
  onDecide: (payload: DecidePayload) => void
}) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null)

  return (
    <>
      <ClubList clubs={clubs} isLoading={isLoading} error={error} onOpenDetail={setSelectedUuid} />
      {selectedUuid && (
        <ClubDetailModal
          clubUuid={selectedUuid}
          onClose={() => setSelectedUuid(null)}
          subtitle="동아리 상세 검토"
          sidebar={(detail) => (
            <ClubDecisionSidebar detail={detail} isMutating={isMutating} onDecide={onDecide} />
          )}
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

const ClubDecisionSidebar = ({
  detail,
  isMutating,
  onDecide,
}: {
  detail: AdminClubDetail
  isMutating: boolean
  onDecide: (payload: DecidePayload) => void
}) => {
  const [officialVerified, setOfficialVerified] = useState(true)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectReasonError, setRejectReasonError] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    payload: DecidePayload
    message: string
  } | null>(null)

  const requestConfirm = (payload: DecidePayload, message: string) => {
    if (payload.status === 'REJECTED' && !rejectReason.trim()) {
      setRejectReasonError(true)
      return
    }
    setRejectReasonError(false)
    setConfirmAction({ payload, message })
  }

  const handleConfirm = () => {
    if (confirmAction) {
      onDecide(confirmAction.payload)
      setConfirmAction(null)
    }
  }

  const isPending = detail.club_data.status === 'PENDING'

  return (
    <>
      <h3 className="text-base font-bold">신청자</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-slate-950">이름</span> {detail.manager_data.name}
        </p>
        <p>
          <span className="font-semibold text-slate-950">연락처</span> {detail.manager_data.phone}
        </p>
        <p>
          <span className="font-semibold text-slate-950">학번</span>{' '}
          {detail.manager_data.student_id}
        </p>
        <p className="break-all text-xs text-slate-500">{detail.manager_data.service_user_id}</p>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        {isPending ? (
          <>
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
              onChange={(event) => {
                setRejectReason(event.target.value)
                if (event.target.value.trim()) setRejectReasonError(false)
              }}
              className={`mt-3 min-h-[92px] w-full resize-none rounded-md border bg-white px-3 py-2 text-sm outline-none ${
                rejectReasonError
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-primary-600'
              }`}
              placeholder="반려 사유"
            />
            {rejectReasonError && (
              <p className="mt-1 text-xs font-medium text-rose-600">반려 사유를 입력해 주세요.</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isMutating}
                onClick={() =>
                  requestConfirm(
                    {
                      uuid: detail.club_data.uuid,
                      status: 'REJECTED',
                      reject_reason: rejectReason,
                      is_official_verified: false,
                    },
                    '반려 처리하시겠습니까?',
                  )
                }
                className="min-h-[40px] rounded-md border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 disabled:opacity-50"
              >
                반려
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={() =>
                  requestConfirm(
                    {
                      uuid: detail.club_data.uuid,
                      status: 'APPROVED',
                      is_official_verified: officialVerified,
                    },
                    '승인 처리하시겠습니까?',
                  )
                }
                className="min-h-[40px] rounded-md bg-slate-950 text-sm font-semibold text-white disabled:opacity-50"
              >
                승인
              </button>
            </div>
          </>
        ) : (
          <>
            {detail.club_data.status === 'REJECTED' && detail.club_data.reject_reason && (
              <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
                <p className="text-xs font-semibold text-rose-600">반려 사유</p>
                <p className="mt-1 text-sm text-rose-800">{detail.club_data.reject_reason}</p>
              </div>
            )}
            <button
              type="button"
              disabled={isMutating}
              onClick={() =>
                requestConfirm(
                  { uuid: detail.club_data.uuid, status: 'PENDING', is_official_verified: false },
                  '대기 상태로 변경하시겠습니까?',
                )
              }
              className="w-full min-h-[40px] rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              대기로 변경
            </button>
          </>
        )}
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-sm rounded-md bg-white p-5 shadow-xl">
            <p className="text-base font-semibold text-slate-900">{confirmAction.message}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="min-h-[40px] rounded-md border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={handleConfirm}
                className="min-h-[40px] rounded-md bg-slate-950 text-sm font-semibold text-white disabled:opacity-50"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
