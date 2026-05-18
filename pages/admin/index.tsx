import Head from 'next/head'
import React from 'react'
import { useAdminDashboard } from 'src/admin/hooks'
import { AdminLayout, TabFilterBar } from 'src/admin/components/AdminLayout'
import { AdminLoginPage } from 'src/admin/components/AdminLoginPage'
import { ClubsTab } from 'src/admin/components/ClubsTab'
import { HistoriesTab } from 'src/admin/components/HistoriesTab'
import { ManagerRequestsTab } from 'src/admin/components/ManagerRequestsTab'
import { VerificationRequestsTab } from 'src/admin/components/VerificationRequestsTab'

const AdminDashboardPage = () => {
  const {
    authReady,
    authToken,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    totalCount,
    handleLogin,
    handleLogout,
    clubs,
    managerRequests,
    verificationRequests,
    histories,
  } = useAdminDashboard()

  if (!authReady) {
    return (
      <>
        <Head>
          <title>올클 운영진 로그인</title>
        </Head>
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="h-28 w-full max-w-md animate-pulse rounded-md border border-slate-200 bg-white" />
        </main>
      </>
    )
  }

  if (!authToken) {
    return <AdminLoginPage onLogin={handleLogin} />
  }

  return (
    <>
      <Head>
        <title>올클 운영진 대시보드</title>
      </Head>
      <AdminLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalCount={totalCount}
        statusFilter={statusFilter}
        onLogout={handleLogout}
      >
        <TabFilterBar
          activeTab={activeTab}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
        {activeTab === 'clubs' && (
          <ClubsTab
            clubs={clubs.data}
            isLoading={clubs.isLoading}
            error={clubs.error}
            isMutating={clubs.isMutating}
            onDecide={clubs.onDecide}
          />
        )}
        {activeTab === 'managerRequests' && (
          <ManagerRequestsTab
            requests={managerRequests.data}
            isLoading={managerRequests.isLoading}
            error={managerRequests.error}
            isMutating={managerRequests.isMutating}
            onDecide={managerRequests.onDecide}
          />
        )}
        {activeTab === 'verificationRequests' && (
          <VerificationRequestsTab
            requests={verificationRequests.data}
            isLoading={verificationRequests.isLoading}
            error={verificationRequests.error}
            isMutating={verificationRequests.isMutating}
            onDecide={verificationRequests.onDecide}
          />
        )}
        {activeTab === 'histories' && (
          <HistoriesTab
            histories={histories.data}
            isLoading={histories.isLoading}
            error={histories.error}
            onSearch={histories.onSearch}
          />
        )}
      </AdminLayout>
    </>
  )
}

export default AdminDashboardPage
