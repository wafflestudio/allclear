import { registry } from 'src/lib/openapi/swagger'
import { z } from 'src/lib/schemas/zod'
import {
  HealthCheckSchema,
  OkResponseSchema,
  TokenResponseSchema,
  UserSchema,
  ClubSchema,
  ValidationIssueSchema,
} from 'src/lib/schemas/common'
import {
  AppleLoginCallbackPayloadSchema,
  KakaoCallbackQuerySchema,
  KakaoNativeCallbackPayloadSchema,
} from 'src/lib/schemas/auth'
import { AnnouncementsResponseSchema } from 'src/lib/schemas/announcements'
import { TermsResponseSchema } from 'src/lib/schemas/terms'
import {
  ClubCategoriesResponseSchema,
  ClubListByCategoryQuerySchema,
  ClubRankingSchema,
  ClubRankingsQuerySchema,
  ClubRankingsResponseSchema,
  ClubsResponseSchema,
  ClubsSearchResponseSchema,
  ClubSearchQuerySchema,
  ClubUuidParamsSchema,
  MyReviewSchema,
  ReviewKeywordCategoriesResponseSchema,
  UpdateClubReviewSchema,
} from 'src/lib/schemas/clubs'
import {
  ClubRecruitmentParamsSchema,
  ClubRecruitmentSchema,
  CreateRecruitmentResponseSchema,
  CreateClubRecruitmentSchema,
  PublicClubRecruitmentDetailResponseSchema,
  PublicClubRecruitmentsResponseSchema,
  RecruitmentIdParamsSchema,
  UpdateClubRecruitmentSchema,
  UpdateRecruitmentResponseSchema,
} from 'src/lib/schemas/club-recruitments'
import {
  ClubImageUploadSchema,
  ClubCreationDecisionSchema,
  ClubRegisterRequestSchema,
  ClubManagerRequestSchema,
  ClubManagerRegisterRequestSchema,
  ManagedClubPatchSchema,
  ManagedClubsResponseSchema,
  ManagerClubParamsSchema,
  CreateVerificationRequestResponseSchema,
} from 'src/lib/schemas/managers'
import {
  CollegeMajorsQuerySchema,
  CollegeMajorsResponseSchema,
  DownloadAppLogQuerySchema,
  UpdateDeviceSchema,
  UpdateProfileSchema,
  UserClubsResponseSchema,
  UserProfileResponseSchema,
  UserVoiceSchema,
} from 'src/lib/schemas/users'

const ErrorMessageSchema = z.string()
const NoContentResponse = { description: '성공적으로 처리되었습니다.' }

const validationErrorResponse = {
  description: '잘못된 요청입니다.',
  content: {
    'application/json': {
      schema: z.array(ValidationIssueSchema),
    },
  },
}

const internalServerErrorResponse = {
  description: '서버 내부 오류',
  content: {
    'text/plain': {
      schema: ErrorMessageSchema,
    },
  },
}

const notFoundResponse = {
  description: '리소스를 찾을 수 없습니다.',
  content: {
    'text/plain': {
      schema: ErrorMessageSchema,
    },
  },
}

const unauthorizedResponse = {
  description: '인증이 필요합니다.',
  content: {
    'text/plain': {
      schema: ErrorMessageSchema,
    },
  },
}

const forbiddenResponse = {
  description: '권한이 없습니다.',
  content: {
    'text/plain': {
      schema: ErrorMessageSchema,
    },
  },
}

const conflictResponse = {
  description: '리소스 제약 조건과 충돌합니다.',
  content: {
    'text/plain': {
      schema: ErrorMessageSchema,
    },
  },
}

const successMessageSchema = z.object({
  success: z.literal(true),
  message: z.string(),
})

const failedMessageSchema = z.object({
  success: z.literal(false),
  message: z.string(),
})

const clubRegisterRequestExample = {
  club_data: {
    name: '와플스튜디오',
    type: '교내',
    image_uri: 'https://cdn.allclear.com/temp/upload_123.jpg',
    category: '진로',
    affiliation: '컴퓨터공학부',
    short_description: '웹/앱 개발 동아리',
    recruit_type: '정기',
    min_activity_period: 1,
    has_dongbang: true,
    dongbang_location: '63동 619호',
    sns: 'https://www.instagram.com/wafflestudio_official/',
    introduction: '동아리 소개글',
  },
  manager_data: {
    name: '홍길동',
    phone: '010-1234-5678',
    student_id: '2021-12345',
  },
}

const clubRecruitmentRequestExample = {
  title: '2026년 하반기 와플스튜디오 루키 모집',
  deadline: '2026-03-15T23:59:00Z',
  is_mandatory: true,
  has_regular_meeting: true,
  regular_meetings: [
    { day_of_week: '월요일', start_time: '19:00', end_time: '21:00' },
    { day_of_week: '수요일', start_time: '19:00', end_time: '21:00' },
  ],
  activity_location_type: '동방',
  activity_location_text: '301동 2층 동아리방 및 비대면 병행',
  has_eligibility: true,
  eligibility_text: '서울대학교 재학생 및 휴학생 (전공 무관)',
  has_capacity_limit: true,
  capacity_limit_text: '00명 (개발 파트별 상이)',
  has_membership_fee: true,
  membership_fee_text: '학기당 3만원 (운영비 사용)',
  application_url: 'https://wafflestudio.com/apply',
  application_process: '서류 심사 -> 면접 -> 최종 합격',
  full_recruitment_text: '기존 공고문 전체 텍스트 내용...',
  image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
}

const publicRecruitmentsResponseExample = {
  success: true,
  message: '해당 동아리의 공고 목록 조회가 완료되었습니다.',
  data: {
    club_name: '와플스튜디오',
    recruitments: [
      {
        id: 105,
        display_title: '2026년 3월 공고',
        title: '2026년 상반기 루키 모집',
        deadline: '2026-03-15T23:59:00Z',
        is_active: true,
      },
      {
        id: 88,
        display_title: '2025년 9월 공고',
        title: '2025년 하반기 루키 모집',
        deadline: '2025-09-10T23:59:00Z',
        is_active: false,
      },
    ],
  },
}

const publicRecruitmentDetailResponseExample = {
  success: true,
  data: {
    id: 105,
    display_title: '2026년 3월 공고',
    club_id: '123e4567-e89b-12d3-a456-426614174000',
    content: clubRecruitmentRequestExample,
  },
}

registry.registerPath({
  method: 'get',
  path: '/api/v1/announcements',
  tags: ['Announcements'],
  summary: '노출할 공지 목록 조회',
  security: [{}, { bearerAuth: [] }],
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: AnnouncementsResponseSchema,
        },
      },
    },
    401: unauthorizedResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/terms',
  tags: ['Terms'],
  summary: '미동의 약관 목록 조회',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: TermsResponseSchema,
        },
      },
    },
    401: unauthorizedResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/health-check',
  tags: ['System'],
  summary: '헬스 체크',
  responses: {
    200: {
      description: '정상 응답',
      content: {
        'application/json': {
          schema: HealthCheckSchema,
        },
      },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/kakao',
  tags: ['Auth'],
  summary: '카카오 로그인 시작',
  responses: {
    301: {
      description: '카카오 인증 페이지로 리다이렉트됩니다.',
    },
    405: unauthorizedResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/kakao/callback',
  tags: ['Auth'],
  summary: '카카오 웹 로그인 콜백',
  request: {
    query: KakaoCallbackQuerySchema,
  },
  responses: {
    200: {
      description: '로그인 성공',
      content: {
        'application/json': {
          schema: TokenResponseSchema,
        },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/kakao/native/callback',
  tags: ['Auth'],
  summary: '카카오 네이티브 로그인 콜백',
  request: {
    body: {
      content: {
        'application/json': {
          schema: KakaoNativeCallbackPayloadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '로그인 성공',
      content: {
        'application/json': {
          schema: TokenResponseSchema,
        },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/apple/callback',
  tags: ['Auth'],
  summary: '애플 로그인 콜백',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AppleLoginCallbackPayloadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '로그인 성공',
      content: {
        'application/json': {
          schema: TokenResponseSchema,
        },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/leave',
  tags: ['Auth'],
  summary: '회원 탈퇴',
  security: [{ bearerAuth: [] }],
  responses: {
    204: NoContentResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/clubs',
  tags: ['Clubs'],
  summary: '카테고리별 동아리 목록',
  request: {
    query: ClubListByCategoryQuerySchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ClubsResponseSchema,
        },
      },
    },
    400: {
      description: 'category 쿼리가 필요합니다.',
      content: {
        'text/plain': {
          schema: ErrorMessageSchema,
        },
      },
    },
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/clubs/latest',
  tags: ['Clubs'],
  summary: '최신 등록 동아리 목록',
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ClubsResponseSchema,
        },
      },
    },
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/clubs/popular',
  tags: ['Clubs'],
  summary: '인기 동아리 목록',
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ClubsResponseSchema,
        },
      },
    },
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/clubs/search',
  tags: ['Clubs'],
  summary: '동아리 검색',
  request: {
    query: ClubSearchQuerySchema,
  },
  responses: {
    200: {
      description: '검색 성공',
      content: {
        'application/json': {
          schema: ClubsSearchResponseSchema,
        },
      },
    },
    400: {
      description: 'query 쿼리가 필요합니다.',
      content: {
        'text/plain': {
          schema: ErrorMessageSchema,
        },
      },
    },
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/clubs/categories',
  tags: ['Clubs'],
  summary: '동아리 카테고리 목록',
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ClubCategoriesResponseSchema,
        },
      },
    },
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/clubs/rankings',
  tags: ['Reviews'],
  summary: '리뷰 기반 동아리 랭킹',
  request: {
    query: ClubRankingsQuerySchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ClubRankingsResponseSchema,
        },
      },
    },
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/clubs/reviews/keywords',
  tags: ['Reviews'],
  summary: '리뷰 키워드 카테고리 목록',
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ReviewKeywordCategoriesResponseSchema,
        },
      },
    },
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/clubs/{uuid}',
  tags: ['Clubs'],
  summary: '동아리 상세 조회',
  request: {
    params: ClubUuidParamsSchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ClubSchema,
        },
      },
    },
    400: validationErrorResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/clubs/register',
  tags: ['Clubs'],
  summary: '동아리 등록 신청',
  description:
    '로그인한 사용자가 신규 동아리 등록을 신청합니다. 현재 교외 동아리는 신청할 수 없으며, 신청된 동아리는 PENDING 상태로 저장됩니다.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: ClubRegisterRequestSchema,
          example: clubRegisterRequestExample,
        },
      },
    },
  },
  responses: {
    201: {
      description: '동아리 등록 신청 성공',
      content: {
        'application/json': {
          schema: successMessageSchema,
          example: {
            success: true,
            message: '동아리 등록 신청이 완료되었습니다.',
          },
        },
      },
    },
    400: {
      description: '필수 필드가 누락되었거나 현재 신청할 수 없는 동아리 유형입니다.',
      content: {
        'application/json': {
          schema: z.union([z.array(ValidationIssueSchema), failedMessageSchema]),
          example: {
            success: false,
            message: '현재 교외 동아리는 등록 신청이 불가능합니다.',
          },
        },
      },
    },
    401: unauthorizedResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/clubs/{uuid}/manager-requests',
  tags: ['Clubs'],
  summary: '동아리 관리 권한 신청',
  description:
    '이미 등록된 동아리에 대해 로그인한 사용자가 관리자 매핑을 요청합니다. 대기 중인 본인 요청이나 이미 승인된 관리자 매핑이 있으면 409를 반환합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubUuidParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: ClubManagerRequestSchema,
          example: {
            name: '홍길동',
            phone: '010-1234-5678',
            student_id: '2021-12345',
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: '동아리 관리 권한 신청 성공',
      content: {
        'application/json': {
          schema: successMessageSchema,
          example: {
            success: true,
            message: '동아리 관리 권한 신청이 완료되었습니다. 운영진 검토 후 승인됩니다.',
          },
        },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    404: notFoundResponse,
    409: conflictResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/clubs/{uuid}/recruitments',
  tags: ['Clubs'],
  summary: '동아리 모집공고 목록 조회',
  description:
    '동아리 상세 화면에서 사용할 공개 모집공고 목록입니다. 삭제되지 않은 공고를 최근 생성순으로 반환하며, is_active는 deadline이 현재 시각보다 미래인지로 계산합니다.',
  request: {
    params: ClubRecruitmentParamsSchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: PublicClubRecruitmentsResponseSchema,
          example: publicRecruitmentsResponseExample,
        },
      },
    },
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/clubs/{uuid}/recruitments/representative',
  tags: ['Clubs'],
  summary: '동아리 대표 모집공고 조회',
  request: {
    params: ClubRecruitmentParamsSchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ClubRecruitmentSchema.nullable(),
        },
      },
    },
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/recruitments/{recruitmentId}',
  tags: ['Clubs'],
  summary: '동아리 모집공고 상세 조회',
  description:
    '공개 모집공고 상세 정보입니다. recruitmentId만으로 조회하며, 삭제된 공고이거나 소속 동아리가 공개 상태가 아니면 404를 반환합니다.',
  request: {
    params: RecruitmentIdParamsSchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: PublicClubRecruitmentDetailResponseSchema,
          example: publicRecruitmentDetailResponseExample,
        },
      },
    },
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/clubs/{uuid}/reviews',
  tags: ['Reviews'],
  summary: '동아리 리뷰 작성 또는 수정',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubUuidParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateClubReviewSchema,
        },
      },
    },
  },
  responses: {
    204: NoContentResponse,
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/clubs/{uuid}/reviews/me',
  tags: ['Reviews'],
  summary: '내 동아리 리뷰 조회',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubUuidParamsSchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: MyReviewSchema.nullable(),
        },
      },
    },
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

for (const method of ['post', 'delete'] as const) {
  registry.registerPath({
    method,
    path: '/api/v1/clubs/{uuid}/saved',
    tags: ['Clubs'],
    summary: method === 'post' ? '동아리 저장' : '동아리 저장 해제',
    security: [{ bearerAuth: [] }],
    request: {
      params: ClubUuidParamsSchema,
    },
    responses: {
      204: NoContentResponse,
      400: validationErrorResponse,
      404: notFoundResponse,
      500: internalServerErrorResponse,
    },
  })
}

registry.registerPath({
  method: 'get',
  path: '/api/v1/users/me',
  tags: ['Users'],
  summary: '내 프로필 조회',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: UserProfileResponseSchema,
        },
      },
    },
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'put',
  path: '/api/v1/users/me',
  tags: ['Users'],
  summary: '내 프로필 수정',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateProfileSchema,
        },
      },
    },
  },
  responses: {
    204: NoContentResponse,
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/users/me/clubs',
  tags: ['Users'],
  summary: '내가 리뷰한 동아리 목록',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: UserClubsResponseSchema,
        },
      },
    },
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/users/me/clubs/saved',
  tags: ['Users'],
  summary: '내가 저장한 동아리 목록',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: UserClubsResponseSchema,
        },
      },
    },
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'put',
  path: '/api/v1/users/me/devices',
  tags: ['Users'],
  summary: '디바이스 정보 갱신',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateDeviceSchema,
        },
      },
    },
  },
  responses: {
    204: NoContentResponse,
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/users/me/voices',
  tags: ['Users'],
  summary: '사용자 의견 제출',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UserVoiceSchema,
        },
      },
    },
  },
  responses: {
    204: NoContentResponse,
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/users/majors',
  tags: ['Users'],
  summary: '학과 목록 조회',
  request: {
    query: CollegeMajorsQuerySchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: CollegeMajorsResponseSchema,
        },
      },
    },
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/users/download/app',
  tags: ['Users'],
  summary: '앱 다운로드 페이지 진입 로그',
  request: {
    query: DownloadAppLogQuerySchema,
  },
  responses: {
    200: {
      description: '기록 성공',
    },
    405: {
      description: '허용되지 않은 메서드',
    },
  },
})

registry.registerPath({
  method: 'patch',
  path: '/api/v1/club-creation-requests/{uuid}/decision',
  tags: ['Managers'],
  summary: '동아리 생성 요청 승인 또는 반려',
  request: {
    params: ClubUuidParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: ClubCreationDecisionSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '처리 성공',
      content: {
        'application/json': {
          schema: ClubSchema,
        },
      },
    },
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/managers/me/clubs',
  tags: ['Managers'],
  summary: '내가 관리하는 동아리 목록',
  description:
    '로그인한 사용자가 신청했거나 관리 중인 동아리 목록을 조회합니다. 승인 대기, 승인 완료, 반려 상태를 모두 포함합니다.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ManagedClubsResponseSchema,
          example: {
            success: true,
            message: '관리 중인 동아리 목록 및 신청 현황 조회가 완료되었습니다.',
            data: {
              total_count: 3,
              clubs: [
                {
                  uuid: '123e4567-e89b-12d3-a456-426614174000',
                  name: '와플스튜디오',
                  status: 'APPROVED',
                  image_uri: 'https://cdn.allclear.com/temp/upload_123.jpg',
                  created_at: '2026-04-01T10:00:00Z',
                },
                {
                  uuid: '234f5678-f90c-23e4-b567-537725285111',
                  name: '쿠킹마스터',
                  status: 'PENDING',
                  image_uri: 'https://cdn.allclear.com/temp/upload_456.jpg',
                  created_at: '2026-04-03T14:30:00Z',
                },
              ],
            },
          },
        },
      },
    },
    401: unauthorizedResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/managers/me/clubs',
  tags: ['Managers'],
  summary: '동아리 관리자 등록 요청',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: ClubManagerRegisterRequestSchema,
        },
      },
    },
  },
  responses: {
    204: NoContentResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/managers/me/clubs/{uuid}',
  tags: ['Managers'],
  summary: '관리 중인 동아리 상세 조회',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubUuidParamsSchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ClubSchema,
        },
      },
    },
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/managers/me/clubs/{uuid}/recruitments',
  tags: ['Managers'],
  summary: '관리 중인 동아리 모집공고 생성',
  description:
    '동아리 관리자가 새 모집공고를 등록합니다. 공고 생성 시각 기준 year_month가 저장되며, 같은 동아리의 같은 월 공고가 이미 있으면 409를 반환합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubRecruitmentParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: CreateClubRecruitmentSchema,
          example: clubRecruitmentRequestExample,
        },
      },
    },
  },
  responses: {
    201: {
      description: '생성 성공',
      content: {
        'application/json': {
          schema: CreateRecruitmentResponseSchema,
          example: {
            success: true,
            message: '모집 공고가 성공적으로 등록되었습니다.',
            data: {
              recruitment_id: 42,
              club_uuid: '123e4567-e89b-12d3-a456-426614174000',
              year_month: '2026-03',
              deadline: '2026-03-15T23:59:00Z',
            },
          },
        },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'patch',
  path: '/api/v1/managers/me/clubs/{uuid}',
  tags: ['Managers'],
  summary: '관리 중인 동아리 수정',
  description:
    '동아리 관리자가 본인 동아리 정보를 수정합니다. 요청에 포함된 필드만 반영하며 수정 전후 스냅샷은 club_history에 기록됩니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubUuidParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: ManagedClubPatchSchema,
          example: {
            recruit_type: '상시',
            min_activity_period: 2,
            has_dongbang: true,
            dongbang_location: '301동 3층',
            sns: 'https://wafflestudio.com',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: '수정 성공',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.object({
              club_uuid: z.string().uuid(),
              updated_at: z.string(),
            }),
          }),
          example: {
            success: true,
            message: '동아리 정보가 수정되었으며, 수정 이력이 기록되었습니다.',
            data: {
              club_uuid: '123e4567-e89b-12d3-a456-426614174000',
              updated_at: '2026-04-02T10:00:00Z',
            },
          },
        },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'delete',
  path: '/api/v1/managers/me/recruitments/{recruitmentId}',
  tags: ['Managers'],
  summary: '모집공고 삭제',
  description:
    '동아리 관리자가 본인이 관리하는 동아리의 모집공고를 삭제합니다. 실제 행은 제거하지 않고 deleted_at을 갱신합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: RecruitmentIdParamsSchema,
  },
  responses: {
    204: { description: '삭제 성공' },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'patch',
  path: '/api/v1/managers/me/recruitments/{recruitmentId}',
  tags: ['Managers'],
  summary: '모집공고 수정',
  description:
    '동아리 관리자가 모집공고 내용을 부분 수정합니다. regular_meetings가 포함되면 기존 정기모임 목록을 요청 본문의 목록 전체로 교체합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: RecruitmentIdParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateClubRecruitmentSchema,
          example: {
            title: '2026 루키 모집 (기간 연장)',
            deadline: '2026-03-20T23:59:00Z',
            regular_meetings: [
              { day_of_week: '화요일', start_time: '19:00', end_time: '21:00' },
              { day_of_week: '목요일', start_time: '19:00', end_time: '21:00' },
            ],
            capacity_limit_text: '20명 내외로 증원',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: '수정 성공',
      content: {
        'application/json': {
          schema: UpdateRecruitmentResponseSchema,
          example: {
            success: true,
            message: '모집 공고 수정이 완료되었습니다.',
            data: {
              recruitment_id: 105,
              club_uuid: '123e4567-e89b-12d3-a456-426614174000',
              year_month: '2026-03',
              deadline: '2026-03-20T23:59:00Z',
              updated_at: '2026-03-10T15:00:00Z',
            },
          },
        },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/managers/me/clubs/{uuid}/verifications',
  tags: ['Managers'],
  summary: '총동연 공식 인증 요청',
  description:
    '동아리 관리자가 본인 동아리의 총동연 공식 인증을 요청합니다. 이미 공식 인증 상태이거나 승인 대기 요청이 있으면 409를 반환합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubUuidParamsSchema,
  },
  responses: {
    201: {
      description: '인증 요청 성공',
      content: {
        'application/json': {
          schema: CreateVerificationRequestResponseSchema,
          example: {
            success: true,
            message: '총동연 공식 인증 요청이 완료되었습니다. 운영진 검토 후 반영됩니다.',
            data: {
              request_id: 5,
              club_uuid: '123e4567-e89b-12d3-a456-426614174000',
              status: 'PENDING',
              created_at: '2026-04-29T17:00:00Z',
            },
          },
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/managers/me/clubs/{uuid}/images',
  tags: ['Managers'],
  summary: '관리 중인 동아리 이미지 업로드',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubUuidParamsSchema,
    body: {
      content: {
        'multipart/form-data': {
          schema: ClubImageUploadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '업로드 성공',
      content: {
        'application/json': {
          schema: OkResponseSchema,
        },
      },
    },
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/managers/{serviceUserId}/clubs/{uuid}',
  tags: ['Managers'],
  summary: '관리자 권한으로 동아리 매니저 등록',
  request: {
    params: ManagerClubParamsSchema,
  },
  responses: {
    201: {
      description: '등록 성공',
    },
    400: validationErrorResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

export const registeredClubRankingSchema = ClubRankingSchema
export const registeredMyReviewSchema = MyReviewSchema
export const registeredUserSchema = UserSchema
