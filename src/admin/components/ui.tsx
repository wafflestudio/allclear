import React from 'react'
import { statusClassNames, statusLabels, STATUS_FILTERS } from 'src/admin/constants'
import type { ClubStatus, DecisionStatus, StatusFilter } from 'src/admin/types'

export const StatusBadge = ({ status }: { status?: ClubStatus }) => {
  if (!status) {
    return (
      <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
        전체
      </span>
    )
  }
  return (
    <span
      className={`rounded-md border px-3 py-2 text-sm font-semibold ${statusClassNames[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}

export const StatusFilterBar = ({
  value,
  onChange,
}: {
  value: StatusFilter
  onChange: (status: StatusFilter) => void
}) => (
  <div className="mb-5 overflow-x-auto">
    <div className="flex min-w-max gap-2">
      {STATUS_FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
            value === filter.value
              ? 'border-slate-950 bg-slate-950 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  </div>
)

export const RequestCard = ({
  title,
  subtitle,
  meta,
  status,
  children,
}: {
  title: string
  subtitle: string
  meta: string
  status: ClubStatus
  children: React.ReactNode
}) => (
  <article className="rounded-md border border-slate-200 bg-white p-4">
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold">{title}</h3>
          <StatusBadge status={status} />
        </div>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        <p className="mt-2 text-xs text-slate-400">{meta}</p>
      </div>
      {children}
    </div>
  </article>
)

export const DecisionControls = ({
  disabled,
  onDecide,
}: {
  disabled: boolean
  onDecide: (status: DecisionStatus, rejectReason?: string) => void
}) => {
  const [rejectReason, setRejectReason] = React.useState('')

  return (
    <div className="flex w-full flex-col gap-2 md:w-80">
      <textarea
        value={rejectReason}
        onChange={(event) => setRejectReason(event.target.value)}
        disabled={disabled}
        className="min-h-[72px] resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 disabled:bg-slate-100"
        placeholder="반려 사유"
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDecide('REJECTED', rejectReason)}
          className="min-h-[38px] rounded-md border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          반려
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDecide('APPROVED')}
          className="min-h-[38px] rounded-md bg-slate-950 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          승인
        </button>
      </div>
    </div>
  )
}

export const DetailItem = ({
  label,
  value,
  wide = false,
}: {
  label: string
  value: React.ReactNode
  wide?: boolean
}) => (
  <div className={`rounded-md border border-slate-200 bg-white p-3 ${wide ? 'sm:col-span-2' : ''}`}>
    <dt className="text-xs font-bold text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-sm leading-6 text-slate-900">{value}</dd>
  </div>
)

export const LoadingRows = () => (
  <div className="grid gap-3">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="h-28 animate-pulse rounded-md border border-slate-200 bg-white" />
    ))}
  </div>
)

export const ErrorState = ({ error }: { error: unknown }) => (
  <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
    데이터를 불러오지 못했습니다. {error instanceof Error ? error.message : ''}
  </div>
)

export const EmptyState = ({ title }: { title: string }) => (
  <div className="rounded-md border border-dashed border-slate-300 bg-white p-10 text-center">
    <p className="text-base font-semibold text-slate-700">{title}</p>
  </div>
)
