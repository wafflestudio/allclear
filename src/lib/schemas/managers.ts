import {
  CLUB_AFFILIATION_TYPES,
  CLUB_CATEGORIES,
  CLUB_COLLEGES,
  CLUB_RECRUIT_TYPES,
} from 'src/fixtures/club-options'
import { z } from 'src/lib/schemas/zod'
import { ClubSchema } from 'src/lib/schemas/common'

const ClubRecruitTypeInputSchema = z
  .union([z.enum([...CLUB_RECRUIT_TYPES, '매 학기', '매 년'] as const), z.literal('')])
  .nullable()
  .optional()

const NonnegativeIntInputSchema = z
  .preprocess((value) => {
    if (value === undefined) {
      return undefined
    }

    if (value === '' || value === null) {
      return 0
    }

    return Number(value)
  }, z.number().int().nonnegative())
  .optional()

const OptionalUrlStringSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().url().optional(),
)

const SnsUrlsSchema = z.array(z.string().trim().url()).min(1).max(3)
const ActivityImageUrlsSchema = z.array(z.string().trim().url()).max(5).optional()

export const ManagerClubParamsSchema = z
  .object({
    serviceUserId: z.string().uuid(),
    uuid: z.string().uuid(),
  })
  .openapi('ManagerClubParams')

export const ClubManagerRegisterRequestSchema = z
  .object({
    clubId: z.string().uuid(),
    name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    studentId: z.string().trim().optional(),
  })
  .openapi('ClubManagerRegisterRequest')

export const ClubManagerRequestSchema = z
  .object({
    name: z.string().trim().nonempty(),
    phone: z.string().trim().nonempty(),
    student_id: z.string().trim().nonempty(),
  })
  .openapi('ClubManagerRequest')

export type ClubManagerRequest = z.infer<typeof ClubManagerRequestSchema>

export const ClubManagerRequestResponseSchema = z
  .object({
    name: z.string(),
    phone: z.string(),
    student_id: z.string(),
  })
  .openapi('ClubManagerRequestResponse')

export type ClubManagerRequestResponse = z.infer<typeof ClubManagerRequestResponseSchema>

export const ClubManagerRequestPatchSchema = ClubManagerRequestSchema.partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  })
  .openapi('ClubManagerRequestPatch')

export type ClubManagerRequestPatch = z.infer<typeof ClubManagerRequestPatchSchema>

export const ClubRegistrationManagerSchema = z
  .object({
    name: z.string().trim().nonempty(),
    phone: z.string().trim().nonempty(),
    student_id: z.string().trim().nonempty(),
  })
  .openapi('ClubRegistrationManager')

export type ClubRegistrationManager = z.infer<typeof ClubRegistrationManagerSchema>

export const ClubRegistrationManagerPatchSchema = ClubRegistrationManagerSchema.pick({
  name: true,
  phone: true,
  student_id: true,
})
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  })
  .openapi('ClubRegistrationManagerPatch')

export type ClubRegistrationManagerPatch = z.infer<typeof ClubRegistrationManagerPatchSchema>

const clubDraftShape = {
  name: z.string().nonempty().max(30),
  fullName: z.string().nonempty().max(50),
  type: z.enum(['교내', '연합']),
  recruitType: ClubRecruitTypeInputSchema,
  category: z.enum(CLUB_CATEGORIES),
  tags: z
    .array(
      z
        .string()
        .nonempty()
        .max(10)
        .regex(/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9_\-.]+$/),
    )
    .max(5),
  college: z.enum(CLUB_COLLEGES),
  affiliationType: z.enum(CLUB_AFFILIATION_TYPES),
  collegeMajorId: z.number().int().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  dongbangLocation: z.string().nullable().optional(),
  minActivityPeriod: NonnegativeIntInputSchema,
  activeMemberCount: NonnegativeIntInputSchema,
  introduction: z.string().max(1000).nullable().optional(),
  detail: z.string().max(5000).nullable().optional(),
}

const ClubDataSchema = z.object({
  name: z.string().trim().nonempty().max(30),
  type: z.enum(['교내', '교외']),
  image_uri: OptionalUrlStringSchema,
  category: z.enum(CLUB_CATEGORIES),
  affiliation: z.string().trim().nonempty(),
  short_description: z.string().trim().nonempty(),
  recruit_type: z.enum(CLUB_RECRUIT_TYPES),
  min_activity_period: z.number().int().nonnegative(),
  has_dongbang: z.boolean(),
  dongbang_location: z.string().trim().optional(),
  sns_urls: SnsUrlsSchema,
  introduction: z.string().trim().nonempty(),
  activity_image_urls: ActivityImageUrlsSchema,
})

export type ClubData = z.infer<typeof ClubDataSchema>

export const ClubRegisterRequestSchema = z
  .object({
    club_data: ClubDataSchema,
    manager_data: z.object({
      name: z.string().trim().nonempty(),
      phone: z.string().trim().nonempty(),
      student_id: z.string().trim().nonempty(),
    }),
  })
  .openapi('ClubRegisterRequest')

export type ClubRegisterRequest = z.infer<typeof ClubRegisterRequestSchema>

export const ClubRegisterResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      club: ClubSchema,
    }),
  })
  .openapi('ClubRegisterResponse')

export type ClubRegisterResponse = z.infer<typeof ClubRegisterResponseSchema>

export const ManagedClubUpdateSchema = z.object(clubDraftShape).openapi('ManagedClubUpdate')

export const ManagedClubPatchSchema = z
  .object({
    club_data: ClubDataSchema.partial().optional(),
    manager_data: ClubRegistrationManagerPatchSchema.optional(),
  })
  .refine(
    (data) =>
      (data.club_data !== undefined && Object.keys(data.club_data).length > 0) ||
      data.manager_data !== undefined,
    {
      message: 'At least one field is required',
    },
  )
  .openapi('ManagedClubPatch')

export type ManagedClubPatch = z.infer<typeof ManagedClubPatchSchema>

export const ManagedClubListItemSchema = ClubSchema.extend({
  managementStatus: z.enum([
    'APPROVED',
    'REJECTED',
    'MANAGER_REQUEST_REJECTED',
    'PENDING',
    'MANAGER_REQUEST_PENDING',
  ]),
  managerRequestId: z.number().int().optional(),
}).openapi('ManagedClubListItem')

export const ManagedClubsResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      total_count: z.number().int(),
      clubs: z.array(ManagedClubListItemSchema),
    }),
  })
  .openapi('ManagedClubsResponse')

export const ClubImageUploadSchema = z
  .object({
    file: z.string().openapi({
      type: 'string',
      format: 'binary',
      description: '업로드할 동아리 이미지 파일',
    }),
  })
  .openapi('ClubImageUpload')

export const ClubActivityImageUploadResponseSchema = z
  .object({
    url: z.string().url(),
  })
  .openapi('ClubActivityImageUploadResponse')

export const CreateVerificationRequestResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      request_id: z.number().int(),
      club_uuid: z.string().uuid(),
      status: z.literal('PENDING'),
      created_at: z.string(),
    }),
  })
  .openapi('CreateVerificationRequestResponse')

export type CreateVerificationRequestResponse = z.infer<
  typeof CreateVerificationRequestResponseSchema
>
