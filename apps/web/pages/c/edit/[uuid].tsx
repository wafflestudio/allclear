import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { Controller, SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { useMutation, useQuery } from 'react-query'
import { Club, ClubCollegeMajor } from '../../../src/entities/club'
import {
  CLUB_AFFILIATION_TYPES,
  CLUB_CATEGORIES,
  CLUB_COLLEGES,
  CLUB_RECRUIT_TYPES,
  getClubRepository,
  UpdateManageClubImageRequest,
  UpdateManageClubRequest,
  UpdateManageClubRequestValidator,
} from '../../../src/repositories/club'
import { getClubService } from '../../../src/usecases/club'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import { GetServerSidePropsContext, Metadata, ResolvingMetadata } from 'next'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

type CollegeMajorsResponse = {
  majors: ClubCollegeMajor[]
  totalSize: number
}

const fetchManageClub = async (uuid: Club['uuid'], authorization: string): Promise<Club> => {
  const response = await fetch(`/api/v2/managers/me/clubs/${uuid}`, {
    headers: { 'x-authorization': authorization },
  }).then((res) => {
    if (!res.ok) throw new Error('Error fetching club by key')

    return res.json() as Promise<Club>
  })
  return response
}

const fetchCollegeMajors = async (): Promise<ClubCollegeMajor[]> => {
  const response = await fetch('/api/v2/users/majors?includeNullMajor=true').then((res) => {
    if (!res.ok) throw new Error('Error fetching college majors')

    return res.json() as Promise<CollegeMajorsResponse>
  })

  return response.majors
}

export async function generateMetadata(
  { params }: { params: { uuid: Club['uuid']; authorization: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || []
  const club = await fetchManageClub(params.uuid, params.authorization)

  if (!club) {
    return {
      title: '서울대 모든 동아리 - 한 번에 올클하기',
      openGraph: {
        title: '서울대 모든 동아리 - 한 번에 올클하기',
        description: '스랖 에타 eTL 올클 렛츠고 🥳',
        images: ['/images/share-logo.png', ...previousImages],
      },
    }
  }

  return {
    title: `${club.name} 정보 수정하기`,
    openGraph: {
      title: `${club.name} 정보 수정하기`,
      description: `${club.fullName || club.name} 동아리 정보를 수정하는 어드민 사이트입니다.`,
      images: [club.imageUri, ...previousImages],
    },
  }
}

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  return {
    props: {
      uuid: context.params?.uuid ?? '',
      authorization: context.req.headers['x-authorization'] ?? '',
    },
  }
}

const ClubEditPage = ({ uuid, authorization }: { uuid: Club['uuid']; authorization: string }) => {
  const { data: club } = useManageClub(uuid, authorization)
  const updateClubMutation = useUpdateClub()

  if (!club || !authorization) return null

  // recruitType이 nullable validation에 실패하는 버그 픽스 안하고 싶어서 임시로 해결
  const clubWithStringRecruitType: Club = {
    ...club,
    recruitType: !club.recruitType ? '선택 안함' : club.recruitType,
  }

  return (
    <EditClub
      club={clubWithStringRecruitType}
      updateClubMutation={updateClubMutation}
      authorization={authorization}
    />
  )
}

type Props = {
  club: Club
  authorization: string
  updateClubMutation: ReturnType<typeof useUpdateClub>
}

const EditClub = ({ club, authorization, updateClubMutation }: Props) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateManageClubRequest>({
    defaultValues: {
      name: club.name,
      fullName: club.fullName,
      type: club.type as any,
      recruitType: club.recruitType as any,
      category: club.category as any,
      college: club.college as any,
      affiliationType: (club.affiliationType || '기타') as any,
      collegeMajorId: club.collegeMajorId ?? null,
      tags: club.tags,
      introduction: club.introduction,
      detail: club.article as any,
      file: undefined, // 이미지 업로드는 따로 처리
    },
    resolver: zodResolver(UpdateManageClubRequestValidator),
  })
  const [articleUpdated, setArticleUpdated] = useState(false)
  const { data: collegeMajors = [] } = useCollegeMajors()

  const { fields, append, remove } = useFieldArray<string[]>({
    // @ts-ignore
    control,
    // @ts-ignore
    name: 'tags',
  })

  const watchedFile = (watch('file') as any)?.length > 0 ? watch('file')[0] : null
  const newFileUrl = useMemo(
    () => (watchedFile && window?.URL ? window.URL.createObjectURL(watchedFile) : null),
    [watchedFile],
  )

  const onSubmit: SubmitHandler<UpdateManageClubRequest> = async (data) => {
    const { file, ...rest } = data
    const image = file?.length ? file[0] : null
    const clubReq: UpdateManageClubRequest = {
      ...rest,
      detail: articleUpdated ? rest.detail : club.article,
      recruitType: rest.recruitType === '선택 안함' ? null : (rest.recruitType as any),
      collegeMajorId: rest.collegeMajorId ?? null,
      introduction: rest.introduction?.trim(),
      uuid: club.uuid,
      authorization,
    }

    const imageReq = image
      ? {
          image,
          uuid: club.uuid,
          authorization,
        }
      : undefined
    return await updateClubMutation.mutateAsync({ clubReq, imageReq }).then(() => {
      alert('동아리 프로필을 업데이트했어요!')
    })
  }

  return (
    <section>
      <div className="max-w-2xl px-4 py-8 mx-auto lg:py-16">
        <form onSubmit={handleSubmit(onSubmit)}>
          <h3 className="mb-4 text-base font-normal leading-none text-gray-600">{club.fullName}</h3>
          <hr className="mb-6 border-gray-300" />
          <div className="grid gap-4 mb-4 md:gap-6 md:grid-cols-2 sm:mb-8">
            <div className="sm:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-900" htmlFor="file_input">
                대표 이미지 설정 (선택)
              </label>
              <div className="items-center w-full sm:flex">
                <img
                  className="w-20 h-20 mb-4 rounded-full sm:mr-4 sm:mb-0"
                  src={newFileUrl || club.imageUri}
                  alt="프로필 이미지"
                />
                <div className="w-full">
                  <input
                    className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 "
                    aria-describedby="file_input_help"
                    id="file"
                    type="file"
                    accept="image/*"
                    {...register('file')}
                  />
                  <p className="mt-1 text-xs font-normal text-gray-500" id="file_input_help">
                    PNG, JPG/JPEG or GIF (MAX. 4.5MB).
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 ">
                짧은 동아리명 (필수) (16자 이내)
              </label>
              <input
                type="text"
                id="name"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 "
                {...register('name', { required: true })}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  짧은 동아리명은 16자 이내로 입력해주세요.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="fullName" className="block mb-2 text-sm font-medium text-gray-900 ">
                동아리 전체 명칭 (필수) (40자 이내)
              </label>
              <input
                type="text"
                id="fullName"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 "
                {...register('fullName', { required: true })}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">
                  동아리 전체 명칭은 40자 이내로 입력해주세요.
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="type"
                className="inline-flex items-center mb-2 text-sm font-medium text-gray-900 "
              >
                교내/연합 여부 (필수)
              </label>
              <select
                id="type"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 "
                {...register('type', { required: true })}
              >
                <option value="교내">교내동아리</option>
                <option value="연합">연합동아리</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-xs text-red-500">{'"교내" 혹은 "연합"을 선택해주세요'}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="recruitType"
                className="inline-flex items-center mb-2 text-sm font-medium text-gray-900 "
              >
                모집 주기 (선택)
              </label>
              <select
                id="recruitType"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 "
                {...register('recruitType', { required: false })}
              >
                <option value={'선택 안함'}>선택 안함</option>
                {CLUB_RECRUIT_TYPES.map((recruitType) => (
                  <option key={recruitType} value={recruitType}>
                    {recruitType + ' 모집'}
                  </option>
                ))}
              </select>
              {errors.recruitType && (
                <p className="mt-1 text-xs text-red-500">모집 주기를 선택해주세요</p>
              )}
            </div>
            <div>
              <label
                htmlFor="category"
                className="inline-flex items-center mb-2 text-sm font-medium text-gray-900 "
              >
                동아리 카테고리 (필수)
              </label>
              <select
                id="category"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 "
                {...register('category', { required: true })}
              >
                {CLUB_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-500">동아리 카테고리를 선택해주세요</p>
              )}
            </div>
            <div>
              <label
                htmlFor="college"
                className="inline-flex items-center mb-2 text-sm font-medium text-gray-900 "
              >
                레거시 소속 단과대학 (필수)
              </label>
              <select
                id="college"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 "
                {...register('college', { required: true })}
              >
                {CLUB_COLLEGES.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                기존 로직 호환을 위해 유지되는 필드입니다. 아래 신규 소속 정보와 독립적으로
                수정됩니다.
              </p>
              {errors.college && (
                <p className="mt-1 text-xs text-red-500">소속 단과대학을 선택해주세요</p>
              )}
            </div>
            <div>
              <label
                htmlFor="affiliationType"
                className="inline-flex items-center mb-2 text-sm font-medium text-gray-900 "
              >
                동아리 종류 (신규)
              </label>
              <select
                id="affiliationType"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 "
                {...register('affiliationType', { required: true })}
              >
                {CLUB_AFFILIATION_TYPES.map((affiliationType) => (
                  <option key={affiliationType} value={affiliationType}>
                    {affiliationType}
                  </option>
                ))}
              </select>
              {errors.affiliationType && (
                <p className="mt-1 text-xs text-red-500">동아리 종류를 선택해주세요</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="collegeMajorId"
                className="inline-flex items-center mb-2 text-sm font-medium text-gray-900 "
              >
                신규 소속 정보
              </label>
              <Controller
                name="collegeMajorId"
                control={control}
                render={({ field }) => (
                  <select
                    id="collegeMajorId"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 "
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(event.target.value ? Number(event.target.value) : null)
                    }
                  >
                    <option value="">선택 안함</option>
                    {collegeMajors.map((collegeMajor) => (
                      <option key={collegeMajor.id} value={collegeMajor.id}>
                        {formatCollegeMajorLabel(collegeMajor)}
                      </option>
                    ))}
                  </select>
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                `college_major_id` 대신 실제 소속 내용을 보여주며, 동아리 종류와 별도로 관리됩니다.
              </p>
              {errors.collegeMajorId && (
                <p className="mt-1 text-xs text-red-500">신규 소속 정보를 다시 확인해주세요</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="tags" className="block mb-2 text-sm font-medium text-gray-900 ">
                해시태그 리스트 (공백과 # 없이 10자 이내 한영문/숫자/_) (최대 5개)
              </label>
              <ul id="tags" className="flex flex-col gap-1">
                {fields.map((item, index) => (
                  <li key={item.id} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <Controller
                        render={({ field }) => (
                          <input
                            className="w-fit bg-white border border-gray-300 text-gray-900 text-sm rounded focus:ring-primary-600 focus:border-primary-600 px-2.5 py-1"
                            {...field}
                          />
                        )}
                        name={`tags.${index}`}
                        control={control}
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="border px-2 rounded border-red-600 text-red-500 text-sm h-fit py-1 hover:bg-red-50 hover:text-red-600"
                      >
                        태그 삭제
                      </button>
                    </div>
                    {errors.tags?.[index] && (
                      <p className="mt-1 text-xs text-red-500">
                        해시태그는 공백과 # 없이 10자 이내 한영문/숫자/_로 입력해주세요
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  if (fields.length >= 5) {
                    return
                  }
                  append('' as any)
                }}
                className="border h-fit mt-2 px-4 py-2 border-blue-600 text-blue-500 text-sm font-medium rounded hover:bg-blue-50 hover:text-blue-600"
              >
                태그 추가
              </button>
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="introduction"
                className="block mb-2 text-sm font-medium text-gray-900 "
              >
                동아리 소개 (선택) (1,000자 이내)
              </label>
              <div className="w-full border border-gray-200 rounded-lg bg-gray-50 ">
                <div>
                  <Controller
                    name="introduction"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <ReactQuill
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        className=" whitespace-pre-wrap"
                      />
                    )}
                  />
                </div>
              </div>
              {errors.introduction && (
                <p className="mt-1 text-xs text-red-500">
                  동아리 소개문을 1,000자 이내로 입력해주세요
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="detail" className="block mb-2 text-sm font-medium text-gray-900 ">
                동아리 상세 정보 (선택) (5,000자 이내)
              </label>
              <div className="w-full border border-gray-200 rounded-lg bg-gray-50 ">
                <div className="flex items-center justify-between px-3 py-2 border-b ">
                  <button
                    type="button"
                    data-tooltip-target="tooltip-fullscreen"
                    className="p-2 text-gray-500 rounded cursor-pointer sm:ml-auto hover:text-gray-900 hover:bg-gray-100 "
                  >
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span className="sr-only">Full screen</span>
                  </button>
                  <div
                    id="tooltip-fullscreen"
                    role="tooltip"
                    className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip "
                    data-popper-reference-hidden=""
                    data-popper-escaped=""
                    data-popper-placement="bottom"
                  >
                    Show full screen
                    <div className="tooltip-arrow" data-popper-arrow=""></div>
                  </div>
                </div>
                <div>
                  <Controller
                    name="detail"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <ReactQuill
                        value={field.value ?? ''}
                        onChange={(...event: any[]) => {
                          setArticleUpdated(true)
                          field.onChange(...event)
                        }}
                        className=" whitespace-pre-wrap"
                      />
                    )}
                  />
                  {errors.detail && (
                    <p className="mt-1 text-xs text-red-500">
                      동아리 상세 정보를 5,000자 이내로 입력해주세요
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 mb-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="disabled:opacity-50 text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center "
            >
              {isSubmitting && (
                <svg
                  aria-hidden="true"
                  role="status"
                  className="inline w-4 h-4 mr-3 text-white animate-spin"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="#E5E7EB"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentColor"
                  />
                </svg>
              )}
              {isSubmitting ? '업데이트하는 중...' : '동아리 프로필 업데이트'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

const useManageClub = (uuid: Club['uuid'], authorization: string) => {
  const clubService = useMemo(() => {
    const clubRepository = getClubRepository()
    return getClubService({ repositories: [clubRepository] })
  }, [])

  return useQuery(
    ['manageClub', { uuid }],
    () => clubService.getManageClub({ uuid, authorization }),
    {
      enabled: !!uuid,
      keepPreviousData: true,
    },
  )
}

const useCollegeMajors = () =>
  useQuery(['collegeMajorsForClubEdit'], fetchCollegeMajors, {
    staleTime: 60 * 1000,
  })

const useUpdateClub = () => {
  const clubService = useMemo(() => {
    const clubRepository = getClubRepository()
    return getClubService({ repositories: [clubRepository] })
  }, [])

  const mutation = useMutation(
    async ({
      clubReq,
      imageReq,
    }: {
      clubReq: UpdateManageClubRequest
      imageReq?: UpdateManageClubImageRequest
    }) => {
      return clubService.updateManageClub(clubReq, imageReq)
    },
  )
  return mutation
}

const formatCollegeMajorLabel = (collegeMajor: ClubCollegeMajor) =>
  collegeMajor.major
    ? [collegeMajor.college, collegeMajor.major].filter(Boolean).join(' / ')
    : collegeMajor.college ?? ''

export default ClubEditPage
