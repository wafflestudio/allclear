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
import {
  AnnouncementsResponseSchema,
  DismissAnnouncementsSchema,
} from 'src/lib/schemas/announcements'
import { AgreeTermsSchema, TermsResponseSchema } from 'src/lib/schemas/terms'
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
  ClubRegisterRequestSchema,
  ClubManagerRequestSchema,
  ClubManagerRegisterRequestSchema,
  ManagedClubPatchSchema,
  ManagedClubsResponseSchema,
  ManagerClubParamsSchema,
  CreateVerificationRequestResponseSchema,
} from 'src/lib/schemas/managers'
import {
  AdminClubDetailResponseSchema,
  AdminClubHistoriesQuerySchema,
  AdminClubHistoriesResponseSchema,
  AdminClubManagerRequestStatusParamsSchema,
  AdminClubManagerRequestStatusUpdateResponseSchema,
  AdminClubManagerRequestStatusUpdateSchema,
  AdminClubManagerRequestsQuerySchema,
  AdminClubManagerRequestsResponseSchema,
  AdminClubVerificationRequestStatusParamsSchema,
  AdminClubVerificationRequestStatusUpdateResponseSchema,
  AdminClubVerificationRequestStatusUpdateSchema,
  AdminClubVerificationRequestsQuerySchema,
  AdminClubVerificationRequestsResponseSchema,
  AdminClubsQuerySchema,
  AdminClubsResponseSchema,
  AdminClubStatusUpdateResponseSchema,
  AdminClubStatusUpdateSchema,
} from 'src/lib/schemas/admin'
import {
  CollegeMajorsQuerySchema,
  CollegeMajorsResponseSchema,
  DownloadAppLogQuerySchema,
  GuestIdHeaderSchema,
  RecentSearchesResponseSchema,
  UpdateDeviceSchema,
  UpdateProfileSchema,
  UserClubsResponseSchema,
  UserProfileResponseSchema,
  UserVoiceSchema,
} from 'src/lib/schemas/users'
import {
  TestGuestRecentSearchDebugQuerySchema,
  TestGuestRecentSearchDebugResponseSchema,
  TestLoginResponseSchema,
  TestLoginSchema,
} from 'src/lib/schemas/test'

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

const badRequestTextResponse = {
  description: '잘못된 요청입니다.',
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

const adminClubsResponseExample = {
  success: true,
  message: '동아리 목록 조회가 완료되었습니다.',
  data: {
    total_count: 2,
    clubs: [
      {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        name: '와플스튜디오',
        status: 'PENDING',
        category: '진로',
        affiliation: '컴퓨터공학부',
        short_description: '웹/앱 개발 동아리',
        created_at: '2026-04-01T10:00:00Z',
        manager: {
          name: '홍길동',
          phone: '010-1234-5678',
          student_id: '2021-12345',
        },
      },
      {
        uuid: '234f5678-f90c-23e4-b567-537725285111',
        name: '쿠킹마스터',
        status: 'REJECTED',
        category: '문화',
        affiliation: '기타',
        short_description: '요리를 함께 배우는 동아리',
        created_at: '2026-04-03T09:30:00Z',
        manager: {
          name: '김요리',
          phone: '010-9876-5432',
          student_id: '2022-54321',
        },
      },
    ],
  },
}

const adminClubDetailResponseExample = {
  success: true,
  data: {
    club_data: {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      status: 'APPROVED',
      name: '와플스튜디오',
      type: '교내',
      category: '진로',
      affiliation: '컴퓨터공학부',
      college_major_id: 36,
      short_description: '웹/앱 개발 동아리',
      image_uri: 'https://cdn.allclear.com/temp/upload_123.jpg',
      recruit_type: '정기',
      min_activity_period: 1,
      has_dongbang: true,
      dongbang_location: '63동 619호',
      sns: 'https://www.instagram.com/wafflestudio_official/',
      introduction: '동아리 소개글',
      created_at: '2026-04-01T10:00:00Z',
    },
    manager_data: {
      name: '홍길동',
      phone: '010-1234-5678',
      student_id: '2021-12345',
      service_user_id: '417bdb60-c70c-4dfa-bfd4-a5a55a0ae001',
    },
  },
}

const adminClubStatusUpdateResponseExample = {
  success: true,
  message: '상태 변경이 완료되었습니다.',
  data: {
    club_uuid: '123e4567-e89b-12d3-a456-426614174000',
    status: 'APPROVED',
    processed_at: '2026-04-02T10:00:00Z',
  },
}

const adminClubHistoriesResponseExample = {
  success: true,
  message: '동아리 수정 이력 조회가 완료되었습니다.',
  data: {
    total_count: 120,
    histories: [
      {
        id: 501,
        club_uuid: '123e4567-e89b-12d3-a456-426614174000',
        club_name: '와플스튜디오',
        updated_by: {
          service_user_id: '417bdb60-c70c-4dfa-bfd4-a5a55a0ae001',
          name: '홍길동',
        },
        changed_fields: ['short_description', 'sns'],
        before_data: {
          uuid: '123e4567-e89b-12d3-a456-426614174000',
          name: '와플스튜디오',
          short_description: '개발 동아리',
          category: '진로',
          sns: 'https://old-link.com',
          affiliation_type: '소속동아리',
          college_major_id: 36,
          has_dongbang: true,
          dongbang_location: '63동 619호',
          updated_at: '2026-03-01T10:00:00Z',
        },
        after_data: {
          uuid: '123e4567-e89b-12d3-a456-426614174000',
          name: '와플스튜디오',
          short_description: '서울대 최대 규모 개발 동아리',
          category: '진로',
          sns: 'https://new-link.com',
          affiliation_type: '소속동아리',
          college_major_id: 36,
          has_dongbang: true,
          dongbang_location: '63동 619호',
          updated_at: '2026-04-02T15:00:00Z',
        },
        created_at: '2026-04-02T15:00:00Z',
      },
    ],
  },
}

const adminClubManagerRequestsResponseExample = {
  success: true,
  message: '매핑 신청 목록 조회가 완료되었습니다.',
  data: {
    total_count: 15,
    requests: [
      {
        id: 12,
        club_uuid: '123e4567-e89b-12d3-a456-426614174000',
        club_name: '와플스튜디오',
        applicant: {
          service_user_id: '417bdb60-c70c-4dfa-bfd4-a5a55a0ae001',
          name: '홍길동',
          phone: '010-1234-5678',
          student_id: '2021-12345',
        },
        status: 'PENDING',
        created_at: '2026-04-29T14:00:00Z',
      },
      {
        id: 11,
        club_uuid: '234f5678-f90c-23e4-b567-537725285111',
        club_name: '쿠킹마스터',
        applicant: {
          service_user_id: '528cec71-d81d-5egb-cgf5-b6b66b1bf112',
          name: '김요리',
          phone: '010-9876-5432',
          student_id: '2022-54321',
        },
        status: 'APPROVED',
        created_at: '2026-04-28T09:30:00Z',
      },
    ],
  },
}

const adminClubVerificationRequestsResponseExample = {
  success: true,
  message: '공식 인증 요청 목록 조회가 완료되었습니다.',
  data: {
    total_count: 8,
    requests: [
      {
        id: 5,
        club_uuid: '123e4567-e89b-12d3-a456-426614174000',
        club_name: '와플스튜디오',
        category: '진로',
        status: 'PENDING',
        created_at: '2026-04-29T17:00:00Z',
      },
      {
        id: 3,
        club_uuid: '234f5678-f90c-23e4-b567-537725285111',
        club_name: '쿠킹마스터',
        category: '문화',
        status: 'APPROVED',
        created_at: '2026-04-25T11:20:00Z',
      },
    ],
  },
}

const adminClubManagerRequestStatusUpdateResponseExample = {
  success: true,
  message: '매핑 신청 처리가 완료되었습니다.',
  data: {
    request_id: 12,
    club_uuid: '123e4567-e89b-12d3-a456-426614174000',
    status: 'APPROVED',
    processed_at: '2026-04-29T16:00:00Z',
  },
}

const adminClubVerificationRequestStatusUpdateResponseExample = {
  success: true,
  message: '공식 인증 요청 처리가 완료되었습니다.',
  data: {
    request_id: 5,
    club_uuid: '123e4567-e89b-12d3-a456-426614174000',
    status: 'APPROVED',
    is_official_verified: true,
    processed_at: '2026-04-29T18:00:00Z',
  },
}

registry.registerPath({
  method: 'get',
  path: '/api/v2/announcements',
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
  method: 'post',
  path: '/api/v2/announcements/dismiss',
  tags: ['Announcements'],
  summary: '공지 숨김 처리',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: DismissAnnouncementsSchema,
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
  path: '/api/v2/terms',
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
  method: 'post',
  path: '/api/v2/terms/agree',
  tags: ['Terms'],
  summary: '약관 동의 처리',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: AgreeTermsSchema,
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
  path: '/api/v2/auth/kakao',
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
  path: '/api/v2/auth/kakao/callback',
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
  path: '/api/v2/auth/kakao/native/callback',
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
  path: '/api/v2/auth/apple/callback',
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
  path: '/api/test/auth/login',
  tags: ['Test'],
  summary: '테스트 로그인',
  description:
    'Test-only API입니다. production NODE_ENV에서는 404로 비활성화됩니다. username 기준으로 테스트 계정을 생성하거나 재사용하고, Swagger 테스트에 사용할 bearer token을 발급합니다.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: TestLoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '테스트 로그인 성공',
      content: {
        'application/json': {
          schema: TestLoginResponseSchema,
        },
      },
    },
    400: validationErrorResponse,
    404: notFoundResponse,
    405: {
      description: '허용되지 않은 메서드입니다.',
    },
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/test/redis/recent-searches',
  tags: ['Test'],
  summary: '비회원 최근 검색어 Redis 디버그',
  description:
    'Test-only API입니다. production NODE_ENV에서는 404로 비활성화됩니다. guest recent-search Redis key의 TTL, raw sorted-set 값, API 응답 형태를 확인합니다.',
  request: {
    query: TestGuestRecentSearchDebugQuerySchema,
  },
  responses: {
    200: {
      description: 'Redis 디버그 조회 성공',
      content: {
        'application/json': {
          schema: TestGuestRecentSearchDebugResponseSchema,
        },
      },
    },
    400: validationErrorResponse,
    404: notFoundResponse,
    405: {
      description: '허용되지 않은 메서드입니다.',
    },
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v2/auth/leave',
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
  path: '/api/v2/clubs',
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
  path: '/api/v2/clubs/latest',
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
  path: '/api/v2/clubs/popular',
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
  path: '/api/v2/clubs/search',
  tags: ['Clubs'],
  summary: '동아리 검색',
  description:
    '동아리를 검색합니다. query는 필수이며, 검색 결과에 필터 조건을 추가로 적용할 수 있습니다. boolean 필터는 "true" 또는 "false" 문자열로 전달하고, min_activity_period는 0, 1, 2, 3_plus 중 하나 이상을 반복 query parameter로 전달합니다. 검색 성공 후 최근 검색어 저장을 best-effort로 시도합니다. bearer token이 있으면 회원 DB에 저장하고, token이 없으면 valid x-guest-id header 기준으로 비회원 Redis 저장소에 저장합니다.',
  security: [{ bearerAuth: [] }, { guestIdAuth: [] }],
  request: {
    query: ClubSearchQuerySchema,
    headers: GuestIdHeaderSchema,
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
      description: 'query, 필터 query string, 또는 비회원 x-guest-id header가 잘못되었습니다.',
      content: {
        'text/plain': {
          schema: ErrorMessageSchema,
        },
      },
    },
    401: unauthorizedResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v2/clubs/categories',
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
  path: '/api/v2/clubs/rankings',
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
  path: '/api/v2/clubs/reviews/keywords',
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
  path: '/api/v2/clubs/{uuid}',
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
  path: '/api/v2/clubs/register',
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
  path: '/api/v2/clubs/{uuid}/manager-requests',
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
  path: '/api/v2/clubs/{uuid}/recruitments',
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
  path: '/api/v2/clubs/{uuid}/recruitments/representative',
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
  path: '/api/v2/recruitments/{recruitmentId}',
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
  path: '/api/v2/clubs/{uuid}/reviews',
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
  path: '/api/v2/clubs/{uuid}/reviews/me',
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
    path: '/api/v2/clubs/{uuid}/saved',
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
  path: '/api/v2/users/me',
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
  path: '/api/v2/users/me',
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
  path: '/api/v2/users/me/clubs',
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
  path: '/api/v2/users/me/clubs/saved',
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
  path: '/api/v2/users/me/devices',
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
  method: 'get',
  path: '/api/v2/users/me/recent-searches',
  tags: ['Users'],
  summary: '내 최근 검색어 목록 조회',
  description:
    '최근 검색어를 최신순으로 최대 8개 반환합니다. bearer token이 있으면 회원 DB에서 조회하고, token이 없으면 x-guest-id header 기준으로 Redis에서 비회원 최근 검색어를 조회합니다.',
  security: [{ bearerAuth: [] }, { guestIdAuth: [] }],
  request: {
    headers: GuestIdHeaderSchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: RecentSearchesResponseSchema,
        },
      },
    },
    400: badRequestTextResponse,
    401: unauthorizedResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'delete',
  path: '/api/v2/users/me/recent-searches',
  tags: ['Users'],
  summary: '내 최근 검색어 전체 삭제',
  description:
    '최근 검색어를 전체 삭제합니다. bearer token이 있으면 회원 DB에서 삭제하고, token이 없으면 x-guest-id header 기준으로 Redis 비회원 최근 검색어를 삭제합니다. 개별 삭제는 지원하지 않습니다.',
  security: [{ bearerAuth: [] }, { guestIdAuth: [] }],
  request: {
    headers: GuestIdHeaderSchema,
  },
  responses: {
    204: NoContentResponse,
    400: badRequestTextResponse,
    401: unauthorizedResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v2/users/me/voices',
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
  path: '/api/v2/users/majors',
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
  path: '/api/v2/users/download/app',
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
  method: 'get',
  path: '/api/v2/managers/me/clubs',
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
  path: '/api/v2/managers/me/clubs',
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
  path: '/api/v2/managers/me/clubs/{uuid}',
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
  path: '/api/v2/managers/me/clubs/{uuid}/recruitments',
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
  path: '/api/v2/managers/me/clubs/{uuid}',
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
  path: '/api/v2/managers/me/recruitments/{recruitmentId}',
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
  path: '/api/v2/managers/me/recruitments/{recruitmentId}',
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
  path: '/api/v2/managers/me/clubs/{uuid}/verifications',
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
  path: '/api/v2/managers/me/clubs/{uuid}/images',
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
  path: '/api/v2/managers/{serviceUserId}/clubs/{uuid}',
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

registry.registerPath({
  method: 'get',
  path: '/api/v2/admin/clubs',
  tags: ['Admin'],
  summary: '운영진 전용 동아리 목록 조회',
  description:
    '운영진 대시보드에서 동아리 목록을 조회합니다. `status` query로 PENDING, APPROVED, REJECTED 중 하나를 필터링할 수 있으며, query를 생략하면 전체 상태를 조회합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    query: AdminClubsQuerySchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: AdminClubsResponseSchema,
          example: adminClubsResponseExample,
        },
      },
    },
    400: validationErrorResponse,
    403: forbiddenResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v2/admin/clubs/histories',
  tags: ['Admin'],
  summary: '운영진 전용 동아리 수정 이력 조회',
  description:
    '이미 승인된 동아리의 정보가 수정되었을 때 기록된 before_data와 after_data를 조회합니다. club_uuid로 특정 동아리의 이력만 필터링할 수 있으며, query로 동아리명 또는 수정한 관리자 이름을 검색할 수 있고, offset/limit으로 페이지네이션할 수 있습니다.',
  security: [{ bearerAuth: [] }],
  request: {
    query: AdminClubHistoriesQuerySchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: AdminClubHistoriesResponseSchema,
          example: adminClubHistoriesResponseExample,
        },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v2/admin/clubs/manager-requests',
  tags: ['Admin'],
  summary: '운영진 전용 매핑 신청 목록 조회',
  description:
    '기존 동아리에 대해 관리자 권한을 요청한 유저들의 리스트를 조회합니다. status query로 PENDING, APPROVED, REJECTED 중 하나를 필터링할 수 있으며, query를 생략하면 전체 상태를 조회합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    query: AdminClubManagerRequestsQuerySchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: AdminClubManagerRequestsResponseSchema,
          example: adminClubManagerRequestsResponseExample,
        },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v2/admin/clubs/verifications',
  tags: ['Admin'],
  summary: '운영진 전용 공식 인증 요청 목록 조회',
  description:
    '동아리 관리자들이 신청한 공식 인증 요청 리스트를 조회합니다. status query로 PENDING, APPROVED, REJECTED 중 하나를 필터링할 수 있으며, query를 생략하면 전체 상태를 조회합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    query: AdminClubVerificationRequestsQuerySchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: AdminClubVerificationRequestsResponseSchema,
          example: adminClubVerificationRequestsResponseExample,
        },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'patch',
  path: '/api/v2/admin/clubs/manager-requests/{id}/status',
  tags: ['Admin'],
  summary: '운영진 전용 매핑 신청 승인 및 반려',
  description:
    '운영진이 특정 동아리 관리 권한 신청 건을 승인 또는 반려합니다. 승인 시 신청 유저가 club_manager에 등록됩니다. 이미 처리된 요청은 다시 수정할 수 없습니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: AdminClubManagerRequestStatusParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: AdminClubManagerRequestStatusUpdateSchema,
          examples: {
            approve: {
              summary: '승인',
              value: {
                status: 'APPROVED',
                reject_reason: '',
              },
            },
            reject: {
              summary: '반려',
              value: {
                status: 'REJECTED',
                reject_reason: '관리자 증빙 정보가 부족합니다.',
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: '처리 성공',
      content: {
        'application/json': {
          schema: AdminClubManagerRequestStatusUpdateResponseSchema,
          example: adminClubManagerRequestStatusUpdateResponseExample,
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
  path: '/api/v2/admin/clubs/verifications/{id}/status',
  tags: ['Admin'],
  summary: '운영진 전용 공식 인증 요청 승인 및 반려',
  description:
    '운영진이 특정 동아리의 공식 인증 요청 건을 승인 또는 반려합니다. 승인 시 해당 동아리의 is_official_verified가 true로 변경됩니다. 이미 처리된 요청은 다시 수정할 수 없습니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: AdminClubVerificationRequestStatusParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: AdminClubVerificationRequestStatusUpdateSchema,
          examples: {
            approve: {
              summary: '승인',
              value: {
                status: 'APPROVED',
                reject_reason: '',
              },
            },
            reject: {
              summary: '반려',
              value: {
                status: 'REJECTED',
                reject_reason: '공식 인증 기준을 충족하지 못했습니다.',
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: '처리 성공',
      content: {
        'application/json': {
          schema: AdminClubVerificationRequestStatusUpdateResponseSchema,
          example: adminClubVerificationRequestStatusUpdateResponseExample,
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
  method: 'get',
  path: '/api/v2/admin/clubs/{uuid}',
  tags: ['Admin'],
  summary: '운영진 전용 동아리 상세 조회',
  description:
    '운영진이 특정 동아리의 등록 신청 내용과 신청자 정보를 상세 조회합니다. PENDING뿐 아니라 APPROVED, REJECTED 상태의 동아리도 히스토리 확인 목적으로 조회할 수 있습니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubUuidParamsSchema,
  },
  responses: {
    200: {
      description: '조회 성공',
      content: {
        'application/json': {
          schema: AdminClubDetailResponseSchema,
          example: adminClubDetailResponseExample,
        },
      },
    },
    400: validationErrorResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

registry.registerPath({
  method: 'patch',
  path: '/api/v2/admin/clubs/{uuid}/status',
  tags: ['Admin'],
  summary: '운영진 전용 동아리 상태 변경',
  description:
    '운영진이 동아리 상태를 변경합니다. 현재 구현은 PENDING, APPROVED, REJECTED를 모두 허용하므로 반려된 동아리를 다시 PENDING으로 되돌릴 수 있습니다. REJECTED로 변경할 때는 reject_reason이 필요합니다.',
  security: [{ bearerAuth: [] }],
  request: {
    params: ClubUuidParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: AdminClubStatusUpdateSchema,
          examples: {
            approve: {
              summary: '승인 및 공식 인증 부여',
              value: {
                status: 'APPROVED',
                reject_reason: '',
                is_official_verified: true,
              },
            },
            reject: {
              summary: '반려',
              value: {
                status: 'REJECTED',
                reject_reason: '동아리 소개와 활동 정보가 부족합니다.',
                is_official_verified: false,
              },
            },
            reopen: {
              summary: '대기 상태로 되돌리기',
              value: {
                status: 'PENDING',
                reject_reason: '',
                is_official_verified: false,
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: '처리 성공',
      content: {
        'application/json': {
          schema: AdminClubStatusUpdateResponseSchema,
          examples: {
            approved: {
              summary: '승인 처리 완료',
              value: adminClubStatusUpdateResponseExample,
            },
            rejected: {
              summary: '반려 처리 완료',
              value: {
                ...adminClubStatusUpdateResponseExample,
                data: {
                  ...adminClubStatusUpdateResponseExample.data,
                  status: 'REJECTED',
                },
              },
            },
            pending: {
              summary: '대기 상태로 변경 완료',
              value: {
                ...adminClubStatusUpdateResponseExample,
                data: {
                  ...adminClubStatusUpdateResponseExample.data,
                  status: 'PENDING',
                },
              },
            },
          },
        },
      },
    },
    400: validationErrorResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    500: internalServerErrorResponse,
  },
})

export const registeredClubRankingSchema = ClubRankingSchema
export const registeredMyReviewSchema = MyReviewSchema
export const registeredUserSchema = UserSchema
