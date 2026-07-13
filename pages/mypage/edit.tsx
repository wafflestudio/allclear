import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { toast } from 'react-toastify'
import { fetchProfile, useProfile } from '../../src/club/auth/AuthContext'
import { authFetch } from '../../src/club/auth/token'
import { BackHeader } from '../../src/club/components/BackHeader'

type CollegeMajor = {
  id: number
  college: string | null
  major: string | null
}

// 앱 EditProfileScreen과 동일: 이름 / 단과대·학과 / 학번 카드 + 하단 저장 버튼
const EditProfilePage = () => {
  const router = useRouter()
  const { user, setUser } = useProfile()

  const [name, setName] = useState('')
  const [college, setCollege] = useState('')
  const [major, setMajor] = useState('')
  const [admissionClass, setAdmissionClass] = useState(26)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.nickname ?? '')
    setCollege(user.college ?? '')
    setMajor(user.major ?? '')
    setAdmissionClass(user.admissionClass ?? 26)
  }, [user])

  const { data: collegeMajors } = useQuery(
    ['collegeMajors'],
    () =>
      authFetch<{ majors: CollegeMajor[]; totalSize: number }>('/api/v2/users/majors').then(
        (res) => res.majors,
      ),
    { staleTime: Infinity, enabled: !!user },
  )

  const colleges = useMemo(
    () => Array.from(new Set((collegeMajors ?? []).map((m) => m.college).filter(Boolean))),
    [collegeMajors],
  ) as string[]

  const majors = useMemo(
    () =>
      (collegeMajors ?? [])
        .filter((m) => m.college === college && m.major)
        .map((m) => m.major as string),
    [collegeMajors, college],
  )

  const isValid = name.trim() !== '' && college !== '' && major !== ''

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return
    const collegeMajorId = (collegeMajors ?? []).find(
      (m) => m.college === college && m.major === major,
    )?.id
    setIsSubmitting(true)
    try {
      await authFetch<void>('/api/v2/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: name, collegeMajorId, major, admissionClass }),
      })
      const profile = await fetchProfile()
      setUser(profile)
      toast.info('프로필이 수정되었어요!')
      router.back()
    } catch {
      toast.error('프로필 수정에 실패했어요')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>프로필 수정 - 서울대 모든 동아리 올클리어</title>
      </Head>

      <div className="min-h-screen bg-[#F3F0F5] font-pretendard text-[#202020]">
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col">
          <BackHeader title="프로필 수정" onBack={() => router.back()} />

          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="rounded-xl bg-white px-6 py-5">
              <p className="mb-2 text-[14px] font-normal text-[#757474]">이름</p>
              <input
                type="text"
                value={name}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full bg-transparent text-[14px] font-normal text-[#202020] placeholder-[#C1C1C1] outline-none"
              />
            </div>

            <div className="rounded-xl bg-white px-6 py-5">
              <p className="mb-2 text-[14px] font-normal text-[#757474]">단과대 및 학과</p>
              <select
                value={college}
                onChange={(e) => {
                  setCollege(e.target.value)
                  setMajor('')
                }}
                className="mb-2 w-full rounded-lg border border-[#EAEAEA] bg-white px-3 py-2.5 text-[14px] text-[#202020]"
              >
                <option value="">단과대를 선택해주세요</option>
                {colleges.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                disabled={!college}
                className="w-full rounded-lg border border-[#EAEAEA] bg-white px-3 py-2.5 text-[14px] text-[#202020] disabled:bg-[#EAEAEA]"
              >
                <option value="">학과를 선택해주세요</option>
                {majors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl bg-white px-6 py-5">
              <p className="mb-2 text-[14px] font-normal text-[#757474]">학번</p>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="학번 줄이기"
                  onClick={() => setAdmissionClass((prev) => Math.max(prev - 1, 0))}
                  className="p-1 text-[#C1C1C1] active:opacity-50"
                >
                  <svg
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M19,13H5V11H19V13Z" />
                  </svg>
                </button>
                <span className="text-[14px] font-semibold text-[#202020]">
                  {String(admissionClass).padStart(2, '0')}학번
                </span>
                <button
                  type="button"
                  aria-label="학번 늘리기"
                  onClick={() => setAdmissionClass((prev) => Math.min(prev + 1, 30))}
                  className="p-1 text-[#C1C1C1] active:opacity-50"
                >
                  <svg
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <button
              type="button"
              disabled={!isValid || isSubmitting}
              onClick={handleSubmit}
              className="w-full rounded-xl bg-[#874FFF] py-4 text-[14px] font-semibold text-white active:bg-[#4F2E94] disabled:opacity-40"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default EditProfilePage
