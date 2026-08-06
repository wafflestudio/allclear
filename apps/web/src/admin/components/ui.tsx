import React from 'react'
import { useClubDetail } from 'src/admin/hooks'
import { statusClassNames, statusLabels, STATUS_FILTERS } from 'src/admin/constants'
import type { AdminClubDetail, ClubStatus, DecisionStatus, StatusFilter } from 'src/admin/types'

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
  pendingCount = 0,
}: {
  value: StatusFilter
  onChange: (status: StatusFilter) => void
  pendingCount?: number
}) => (
  <div className="mb-5 overflow-x-auto">
    <div className="flex min-w-max gap-2 pb-1 pl-px pr-1 pt-1">
      {STATUS_FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={`relative rounded-md border px-3 py-2 text-sm font-semibold transition ${
            value === filter.value
              ? 'border-slate-950 bg-slate-950 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          {filter.label}
          {filter.value === 'PENDING' && pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500" />
          )}
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

const getVisiblePageNumbers = (page: number, totalPages: number) => {
  const maxVisiblePages = 5
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const halfWindow = Math.floor(maxVisiblePages / 2)
  const start = Math.min(Math.max(1, page - halfWindow), totalPages - maxVisiblePages + 1)
  return Array.from({ length: maxVisiblePages }, (_, index) => start + index)
}

export const PaginationBar = ({
  page,
  pageSize,
  totalCount,
  isFetching,
  onPageChange,
}: {
  page: number
  pageSize: number
  totalCount: number
  isFetching?: boolean
  onPageChange: (page: number) => void
}) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  if (totalPages <= 1) return null

  const currentPage = Math.min(Math.max(1, page), totalPages)
  const firstItem = (currentPage - 1) * pageSize + 1
  const lastItem = Math.min(totalCount, currentPage * pageSize)
  const visiblePages = getVisiblePageNumbers(currentPage, totalPages)

  const buttonClassName =
    'h-9 min-w-[36px] rounded-md border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45'

  return (
    <nav
      className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="페이지네이션"
    >
      <p className="text-sm font-medium text-slate-500">
        {firstItem.toLocaleString()}-{lastItem.toLocaleString()} / {totalCount.toLocaleString()}건
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isFetching}
          className={`${buttonClassName} border-slate-300 bg-white text-slate-700 hover:bg-slate-100`}
        >
          이전
        </button>
        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            disabled={pageNumber === currentPage || isFetching}
            aria-current={pageNumber === currentPage ? 'page' : undefined}
            className={`${buttonClassName} ${
              pageNumber === currentPage
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isFetching}
          className={`${buttonClassName} border-slate-300 bg-white text-slate-700 hover:bg-slate-100`}
        >
          다음
        </button>
      </div>
    </nav>
  )
}

const Toast = ({
  id,
  message,
  type,
  onDismiss,
}: {
  id: number
  message: string
  type: 'error' | 'success'
  onDismiss: (id: number) => void
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 3000)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  const styles =
    type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700 [&_button]:text-rose-400 [&_button:hover]:text-rose-600'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700 [&_button]:text-emerald-400 [&_button:hover]:text-emerald-600'

  return (
    <div
      className={`flex max-w-sm items-start gap-3 rounded-md border px-4 py-3 shadow-lg ${styles}`}
    >
      <p className="flex-1 text-sm font-semibold">{message}</p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="shrink-0 text-lg leading-none"
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  )
}

export const ToastContainer = ({
  toasts,
  onDismiss,
}: {
  toasts: { id: number; message: string; type: 'error' | 'success' }[]
  onDismiss: (id: number) => void
}) => {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export const ClubDetailModal = ({
  clubUuid,
  onClose,
  subtitle = '동아리 상세 정보',
  sidebar,
}: {
  clubUuid: string
  onClose: () => void
  subtitle?: string
  sidebar: (detail: AdminClubDetail) => React.ReactNode
}) => {
  const { data, isLoading, error } = useClubDetail(clubUuid)
  const detail = data?.data

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
      onClick={onClose}
    >
      <section
        className="max-h-full w-full max-w-4xl overflow-y-auto rounded-md bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{subtitle}</p>
            <h2 className="text-xl font-bold">{detail?.club_data.name ?? '불러오는 중'}</h2>
            {detail && (
              <p className="mt-0.5 break-all text-xs text-slate-400">{detail.club_data.uuid}</p>
            )}
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
                <div className="flex gap-4">
                  <img
                    src={detail.club_data.image_uri || '/images/share-logo.png'}
                    alt={`${detail.club_data.name} 대표 이미지`}
                    className="h-40 w-40 flex-shrink-0 rounded-md border border-slate-200 object-cover"
                  />
                  <dl className="grid flex-1 content-start gap-3 sm:grid-cols-2">
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
                    <DetailItem
                      label="SNS"
                      value={
                        detail.club_data.sns_urls.length > 0 ? (
                          <ul className="space-y-1">
                            {detail.club_data.sns_urls.map((url) => (
                              <li key={url}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary-700 underline"
                                >
                                  {url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          '-'
                        )
                      }
                      wide
                    />
                    <DetailItem label="소개" value={detail.club_data.introduction ?? '-'} wide />
                  </dl>
                </div>
                <div className="mt-5">
                  <h3 className="text-sm font-bold text-slate-900">활동 사진</h3>
                  {detail.club_data.activity_image_urls.length > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {detail.club_data.activity_image_urls.map((url, index) => (
                        <a
                          key={`${url}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-md border border-slate-200 bg-slate-50"
                        >
                          <img
                            src={url}
                            alt={`${detail.club_data.name} 활동 사진 ${index + 1}`}
                            className="aspect-[4/3] w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">등록된 활동 사진이 없습니다.</p>
                  )}
                </div>
              </div>
              <aside className="rounded-md border border-slate-200 bg-slate-50 p-4">
                {sidebar(detail)}
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
