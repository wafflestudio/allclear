import React from 'react'
import { TABS } from 'src/admin/constants'
import type { AdminTab, StatusFilter } from 'src/admin/types'
import { StatusBadge, StatusFilterBar } from './ui'

type PendingCounts = {
  clubs: number
  managerRequests: number
  verificationRequests: number
}

export const AdminLayout = ({
  activeTab,
  onTabChange,
  totalCount,
  pendingCounts,
  statusFilter,
  onLogout,
  children,
}: {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  totalCount: number
  pendingCounts: PendingCounts
  statusFilter: StatusFilter
  onLogout: () => void
  children: React.ReactNode
}) => (
  <main className="min-h-screen bg-slate-50 text-slate-950">
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-5 lg:px-6">
      <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-60 shrink-0 flex-col justify-between border-r border-slate-200 pr-5 lg:flex">
        <div>
          <div className="mb-8">
            <p className="text-sm font-semibold text-primary-700">Allclear Admin</p>
            <h1 className="mt-2 text-2xl font-bold tracking-normal">운영진 대시보드</h1>
          </div>
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const count = pendingCounts[tab.value as keyof PendingCounts] ?? 0
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onTabChange(tab.value)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                    activeTab === tab.value
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-600 hover:bg-white hover:text-slate-950'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-xs font-bold text-white">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
        <p className="text-xs leading-5 text-slate-500">
          API 응답 권한은 서버의 운영진 인증 정책을 그대로 따릅니다.
        </p>
      </aside>

      <section className="min-w-0 flex-1">
        <div className="mb-5 lg:hidden">
          <p className="text-sm font-semibold text-primary-700">Allclear Admin</p>
          <h1 className="mt-2 text-2xl font-bold">운영진 대시보드</h1>
        </div>

        <div className="mb-5 overflow-x-auto rounded-md border border-slate-200 bg-white p-1 lg:hidden">
          <div className="flex min-w-max gap-1">
            {TABS.map((tab) => {
              const count = pendingCounts[tab.value as keyof PendingCounts] ?? 0
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onTabChange(tab.value)}
                  className={`flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold ${
                    activeTab === tab.value
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-xs font-bold text-white">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">현재 탭</p>
            <h2 className="mt-1 text-3xl font-bold">
              {TABS.find((tab) => tab.value === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={statusFilter === 'ALL' ? undefined : statusFilter} />
            <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold">
              총 {totalCount.toLocaleString()}건
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              로그아웃
            </button>
          </div>
        </header>

        {children}
      </section>
    </div>
  </main>
)

export const TabFilterBar = ({
  activeTab,
  statusFilter,
  onStatusChange,
  pendingCount,
}: {
  activeTab: AdminTab
  statusFilter: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  pendingCount: number
}) => {
  if (activeTab === 'histories') return null
  return <StatusFilterBar value={statusFilter} onChange={onStatusChange} pendingCount={pendingCount} />
}
