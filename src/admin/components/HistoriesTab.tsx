import React, { useState } from 'react'
import { formatDate } from 'src/admin/constants'
import type { ClubHistory } from 'src/admin/types'
import { EmptyState, ErrorState, LoadingRows } from './ui'

export const HistoriesTab = ({
  histories,
  isLoading,
  error,
  onSearch,
}: {
  histories: ClubHistory[]
  isLoading: boolean
  error: unknown
  onSearch: (query: string) => void
}) => {
  const [query, setQuery] = useState('')

  return (
    <>
      <form
        className="mb-5 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          onSearch(query.trim())
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-[42px] flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary-600"
          placeholder="동아리명 또는 관리자 이름 검색"
        />
        <button
          type="submit"
          className="min-h-[42px] rounded-md bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          검색
        </button>
      </form>

      {isLoading && <LoadingRows />}
      {Boolean(error) && <ErrorState error={error} />}
      {!isLoading && !error && !histories.length && (
        <EmptyState title="표시할 수정 이력이 없습니다." />
      )}
      {!isLoading && !error && histories.length > 0 && (
        <div className="grid gap-3">
          {histories.map((history) => (
            <article key={history.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-bold">{history.club_name}</h3>
                  <p className="break-all text-xs text-slate-400">{history.club_uuid}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {history.updated_by.name || history.updated_by.service_user_id} ·{' '}
                    {formatDate(history.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.changed_fields.map((field) => (
                    <span
                      key={field}
                      className="rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <Snapshot
                  title="변경 전"
                  data={history.before_data}
                  fields={history.changed_fields}
                />
                <Snapshot
                  title="변경 후"
                  data={history.after_data}
                  fields={history.changed_fields}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

const Snapshot = ({
  title,
  data,
  fields,
}: {
  title: string
  data: Record<string, unknown>
  fields: string[]
}) => (
  <div className="rounded-md bg-slate-100 p-3">
    <h4 className="mb-2 text-sm font-bold">{title}</h4>
    <dl className="space-y-2">
      {fields.map((field) => (
        <div key={field}>
          <dt className="text-xs font-semibold text-slate-500">{field}</dt>
          <dd className="mt-1 min-h-[30px] break-words rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800">
            {formatSnapshotValue(data[field])}
          </dd>
        </div>
      ))}
    </dl>
  </div>
)

const formatSnapshotValue = (value: unknown) => {
  if (value == null || value === '') return '-'
  return String(value)
}
