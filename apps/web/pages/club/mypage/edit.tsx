import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { updateUser, useCollegeMajors } from '../../../src/club/api/users'
import { type User, useProfile, useRequireLogin } from '../../../src/club/auth/AuthContext'
import { AppTabBar } from '../../../src/club/shared/components/AppTabBar'
import { BackHeader } from '../../../src/club/shared/components/BackHeader'
import { DropDownPicker } from '../../../src/club/shared/components/DropDownPicker'
import { MdiIcon } from '../../../src/club/shared/components/icons'
import { Spinner } from '../../../src/club/shared/components/Spinner'

// 앱 features/mypage/profileUpdate.ts 와 동일: 저장 성공 시 서버 재조회 없이 즉시 반영
const buildUpdatedProfile = (
  user: User,
  profile: {
    nickname: string
    collegeMajorId: number
    college: string
    major: string
    admissionClass: number
  },
): User => ({
  ...user,
  nickname: profile.nickname,
  collegeMajor: {
    id: profile.collegeMajorId,
    college: profile.college,
    major: profile.major,
  },
  admissionClass: profile.admissionClass,
})

/**
 * 앱 EditProfileScreen 과 동일: BackHeader "프로필 수정" → 이름 / 단과대 및 학과 / 학번 카드
 * → 하단 "저장" 버튼. 앱에선 이 화면에서도 하단 탭바가 보인다.
 * 유효성: 이름·단과대·학과가 모두 있고 기존 값과 달라야 저장 가능.
 */
const EditProfilePage = () => {
  const router = useRouter()
  const { user, isLoading, setUser } = useProfile()
  const requireLogin = useRequireLogin()
  const { data: collegeMajors } = useCollegeMajors()

  const [name, setName] = useState(user?.nickname || '')
  const [college, setCollege] = useState(user?.collegeMajor?.college || '')
  const [major, setMajor] = useState(user?.collegeMajor?.major || '')
  const [admissionClass, setAdmissionClass] = useState(user?.admissionClass ?? 26)

  const [openCollegeDropDown, setOpenCollegeDropDown] = useState(false)
  const [openMajorDropDown, setOpenMajorDropDown] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 웹은 프로필이 비동기로 복원되므로 로드되면 폼 초기값을 맞춘다 (앱은 마운트 시점에 user 가 있다)
  useEffect(() => {
    if (!user) return
    setName(user.nickname || '')
    setCollege(user.collegeMajor?.college || '')
    setMajor(user.collegeMajor?.major || '')
    setAdmissionClass(user.admissionClass ?? 26)
  }, [user])

  useEffect(() => {
    if (!isLoading && !user) {
      requireLogin(() => {})
    }
  }, [isLoading, user, requireLogin])

  const isFormValid = !!name && !!college && !!major
  const hasChanges =
    name !== (user?.nickname || '') ||
    college !== (user?.collegeMajor?.college || '') ||
    major !== (user?.collegeMajor?.major || '') ||
    admissionClass !== (user?.admissionClass ?? 26)
  const canSubmit = isFormValid && hasChanges

  const colleges = collegeMajors?.reduce((acc, cur) => {
    if (cur.college && !acc.includes(cur.college)) {
      acc.push(cur.college)
    }
    return acc
  }, [] as string[])

  const majors = collegeMajors?.reduce((acc, cur) => {
    if (cur.major && !acc.includes(cur.major) && cur.college === college) {
      acc.push(cur.major)
    }
    return acc
  }, [] as string[])

  const goBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/club/mypage')
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      const collegeMajorId = collegeMajors?.find(
        (cm) => cm.college === college && cm.major === major,
      )?.id

      if (!collegeMajorId) {
        toast.info('단과대 및 학과를 다시 선택해주세요')
        return
      }

      // Keyboard.dismiss()
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
      await updateUser({
        nickname: name,
        collegeMajorId,
        admissionClass,
      })

      if (user) {
        setUser(
          buildUpdatedProfile(user, {
            nickname: name,
            collegeMajorId,
            college,
            major,
            admissionClass,
          }),
        )
      }
      goBack()

      toast.info('프로필이 수정되었어요!')
    } catch {
      toast.info('이런! 문제가 생겼어요!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeDropdowns = () => {
    setOpenCollegeDropDown(false)
    setOpenMajorDropDown(false)
  }

  return (
    <>
      <Head>
        <title>프로필 수정 - 서울대 모든 동아리 올클리어</title>
      </Head>

      <div className="min-h-screen bg-[#F3F0F5] font-pretendard leading-[normal] text-[#202020]">
        {/* 하단 탭바(86) 위에 화면이 놓인다 */}
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col pb-[86px]">
          <BackHeader title="프로필 수정" onBack={goBack} />

          {isLoading || !user ? (
            <div className="flex-1" />
          ) : (
            <>
              {/* 앱 formArea: Pressable(빈 곳 탭 → 드롭다운 닫기), padding 16, gap 12 */}
              <div className="flex flex-1 flex-col gap-3 p-4" onClick={closeDropdowns}>
                <div className="rounded-xl bg-white px-6 py-5">
                  <p className="mb-2 text-[14px] font-normal text-[#757474]">이름</p>
                  <input
                    type="text"
                    value={name}
                    maxLength={20}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={closeDropdowns}
                    placeholder="이름을 입력하세요"
                    className="w-full bg-transparent p-0 text-[14px] font-normal text-[#202020] outline-none placeholder:text-[#C1C1C1]"
                  />
                </div>

                <div className="relative z-10 rounded-xl bg-white px-6 py-5">
                  <p className="mb-2 text-[14px] font-normal text-[#757474]">단과대 및 학과</p>
                  <DropDownPicker
                    ariaLabel="단과대"
                    zIndex={2000}
                    open={openCollegeDropDown}
                    setOpen={(val) => {
                      setOpenCollegeDropDown(val)
                      setOpenMajorDropDown(false)
                    }}
                    value={college}
                    onSelect={(item) => {
                      if (item !== college) setMajor('')
                      setCollege(item)
                    }}
                    items={colleges ?? []}
                    placeholder="단과대를 선택해주세요"
                  />
                  <div className="h-2" />
                  <DropDownPicker
                    ariaLabel="학과"
                    zIndex={1000}
                    disabled={!college}
                    open={openMajorDropDown}
                    setOpen={(val) => {
                      setOpenCollegeDropDown(false)
                      setOpenMajorDropDown(val)
                    }}
                    value={major}
                    onSelect={setMajor}
                    items={majors ?? []}
                    placeholder="학과를 선택해주세요"
                    paddingX={12}
                  />
                </div>

                <div className="rounded-xl bg-white px-6 py-5">
                  <p className="mb-2 text-[14px] font-normal text-[#757474]">학번</p>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      aria-label="학번 줄이기"
                      onClick={() => setAdmissionClass(Math.max(admissionClass - 1, 0))}
                      className="p-1 active:opacity-50"
                    >
                      <MdiIcon name="minus" size={24} color="#C1C1C1" />
                    </button>
                    <span className="text-[14px] font-semibold text-[#202020]">
                      {`${String(admissionClass).padStart(2, '0')}학번`}
                    </span>
                    <button
                      type="button"
                      aria-label="학번 늘리기"
                      onClick={() => setAdmissionClass(Math.min(admissionClass + 1, 30))}
                      className="p-1 active:opacity-50"
                    >
                      <MdiIcon name="plus" size={24} color="#C1C1C1" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                <button
                  type="button"
                  disabled={!canSubmit || isSubmitting}
                  onClick={handleSubmit}
                  className={`flex w-full items-center justify-center rounded-xl bg-[#874FFF] py-4 ${
                    !canSubmit || isSubmitting ? 'opacity-40' : 'active:opacity-50'
                  }`}
                >
                  {isSubmitting ? (
                    <Spinner color="#FFFFFF" />
                  ) : (
                    <span className="text-[14px] font-semibold text-white">저장</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <AppTabBar active="mypage" />
      </div>
    </>
  )
}

export default EditProfilePage
