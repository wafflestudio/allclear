import React from 'react'
import { formatDate } from 'src/admin/constants'
import type { DecisionStatus, VerificationRequest } from 'src/admin/types'
import { DecisionControls, EmptyState, ErrorState, LoadingRows, RequestCard } from './ui'

export const VerificationRequestsTab = ({
  requests,
  isLoading,
  error,
  isMutating,
  onDecide,
}: {
  requests: VerificationRequest[]
  isLoading: boolean
  error: unknown
  isMutating: boolean
  onDecide: (payload: { id: number; status: DecisionStatus; reject_reason?: string }) => void
}) => {
  if (isLoading) return <LoadingRows />
  if (error) return <ErrorState error={error} />
  if (!requests.length) return <EmptyState title="조건에 맞는 공식 인증 요청이 없습니다." />

  return (
    <div className="grid gap-3">
      {requests.map((item) => (
        <RequestCard
          key={item.id}
          title={item.club_name}
          subtitle={item.category}
          meta={formatDate(item.created_at)}
          status={item.status}
        >
          <DecisionControls
            disabled={item.status !== 'PENDING' || isMutating}
            onDecide={(status, rejectReason) =>
              onDecide({ id: item.id, status, reject_reason: rejectReason })
            }
          />
        </RequestCard>
      ))}
    </div>
  )
}
