import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { request } from 'src/admin/api'
import { AdminLoginPage } from 'src/admin/components/AdminLoginPage'
import { ADMIN_AUTH_TOKEN_KEY } from 'src/admin/constants'

type Status = {
  total: number
  ready: number
  pending: number
  lastUpdatedAt: string | null
  configured: boolean
}

type Batch = {
  scanned: number
  updated: number
  tokens: number
  nextCursor: string | null
}

const ENDPOINT = '/api/v2/admin/clubs/embeddings'

function fetchStatus() {
  return request<Status>(ENDPOINT)
}

function updateBatch(cursor: string | null) {
  return request<Batch>(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ cursor }),
  })
}

export default function EmbeddingUpdatePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ scanned: 0, updated: 0 })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // 화면을 떠난 뒤에는 state를 바꾸지 않습니다.
  const mounted = useRef(false)
  // 갱신이 끝나기 전에 버튼을 다시 눌러도 한 번만 실행합니다.
  const active = useRef(false)

  useEffect(() => {
    mounted.current = true

    const token = window.localStorage.getItem(ADMIN_AUTH_TOKEN_KEY)
    setSignedIn(!!token)

    if (token) {
      fetchStatus()
        .then((value) => mounted.current && setStatus(value))
        .catch((cause) => mounted.current && setError(cause.message))
    }

    return () => {
      mounted.current = false
    }
  }, [])

  async function update() {
    if (active.current) {
      return
    }
    active.current = true

    setRunning(true)
    setError('')
    setMessage('')
    setProgress({ scanned: 0, updated: 0 })

    try {
      let cursor: string | null = null
      let scanned = 0
      let updated = 0

      // 서버가 다음 묶음이 없다고 할 때까지 한 묶음씩 갱신합니다.
      do {
        const batch = await updateBatch(cursor)
        if (!mounted.current) {
          return
        }

        scanned += batch.scanned
        updated += batch.updated
        setProgress({ scanned, updated })

        cursor = batch.nextCursor
      } while (cursor)

      const nextStatus = await fetchStatus()
      if (!mounted.current) {
        return
      }

      setStatus(nextStatus)
      setMessage(completionMessage(updated, nextStatus.pending))
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : '갱신에 실패했습니다.')
      }
    } finally {
      active.current = false

      if (mounted.current) {
        setRunning(false)
      }
    }
  }

  if (signedIn === false) {
    return <AdminLoginPage />
  }

  const canUpdate = !running && status?.configured === true && status.pending > 0

  const buttonLabel = running
    ? `${progress.scanned}개 확인 · ${progress.updated}개 반영 중`
    : '검색 정보 갱신하기'

  const lastUpdatedAt = status?.lastUpdatedAt
    ? new Date(status.lastUpdatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    : '아직 없음'

  return (
    <>
      <Head>
        <title>검색 정보 갱신 · 올클</title>
      </Head>
      <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950">
        <div className="mx-auto max-w-2xl">
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-950">
            ← 운영진 대시보드
          </Link>
          <p className="mt-10 text-sm font-semibold text-primary-700">Allclear Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">검색 정보 갱신</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            동아리 소개·모집·후기를 검색에 반영합니다. 한 달에 한 번 갱신해주세요.
          </p>

          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <dl className="grid grid-cols-3 gap-4">
              <Stat label="전체 동아리" value={status?.total} />
              <Stat label="최신 정보 반영" value={status?.ready} />
              <Stat label="갱신 필요" value={status?.pending} />
            </dl>
            <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
              마지막 반영 {lastUpdatedAt}
            </p>
            <button
              type="button"
              onClick={update}
              disabled={!canUpdate}
              className="mt-6 w-full rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {buttonLabel}
            </button>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              변경된 동아리만 처리합니다. 완료될 때까지 창을 열어두세요. 중단되면 다시 실행할 수
              있습니다.
            </p>
          </section>

          {status && !status.configured && (
            <p className="mt-4 text-sm text-rose-700">
              서버에 임베딩 API 키가 설정되지 않았습니다.
            </p>
          )}

          <div aria-live="polite">
            {message && (
              <p className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                {message}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-800">
                {error}
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-2 text-2xl font-bold tabular-nums">{value ?? '—'}</dd>
    </div>
  )
}

function completionMessage(updated: number, stillPending: number): string {
  const summary = `${updated}개 동아리의 검색 정보를 갱신했습니다.`

  // 갱신하는 동안 내용이 바뀐 동아리는 이번에 반영되지 않습니다.
  if (stillPending > 0) {
    return `${summary} 처리 중 변경된 ${stillPending}개는 다시 갱신해주세요.`
  }
  return summary
}
