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
  ClubRecruitmentIdParamsSchema,
  ClubRecruitmentParamsSchema,
  ClubRecruitmentSchema,
  ClubRecruitmentsResponseSchema,
  CreateClubRecruitmentSchema,
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
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: ClubRegisterRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: '동아리 등록 신청 성공',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
          }),
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
  path: '/api/v1/clubs/{uuid}/manager-requests',
  tags: ['Clubs'],
  summary: '동아리 관리 권한 신청',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubUuidParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: ClubManagerRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: '동아리 관리 권한 신청 성공',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
          }),
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
  request: {
    params: ClubRecruitmentParamsSchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ClubRecruitmentsResponseSchema,
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
  path: '/api/v1/clubs/{uuid}/recruitments/{recruitmentId}',
  tags: ['Clubs'],
  summary: '동아리 모집공고 상세 조회',
  request: {
    params: ClubRecruitmentIdParamsSchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ClubRecruitmentSchema,
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
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ManagedClubsResponseSchema,
        },
      },
    },
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
  method: 'get',
  path: '/api/v1/managers/me/clubs/{uuid}/recruitments',
  tags: ['Managers'],
  summary: '관리 중인 동아리 모집공고 목록 조회',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubRecruitmentParamsSchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: ClubRecruitmentsResponseSchema,
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
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubRecruitmentParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: CreateClubRecruitmentSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: '생성 성공',
      content: {
        'application/json': {
          schema: ClubRecruitmentSchema,
        },
      },
    },
    400: validationErrorResponse,
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
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubUuidParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: ManagedClubPatchSchema,
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
  security: [{ bearerAuth: [] }],
  request: {
    params: RecruitmentIdParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateClubRecruitmentSchema,
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
