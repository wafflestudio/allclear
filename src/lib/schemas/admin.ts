import { z } from 'src/lib/schemas/zod'
import { CLUB_STATUSES, REJECTED_CLUB_STATUS } from 'src/common/constants/club-status'

const AdminClubManagerSchema = z.object({
  name: z.string(),
  phone: z.string(),
  student_id: z.string(),
})

export const AdminClubsQuerySchema = z
  .object({
    status: z.enum(CLUB_STATUSES).optional(),
  })
  .openapi('AdminClubsQuery')

export type AdminClubsQuery = z.infer<typeof AdminClubsQuerySchema>

const AdminClubSchema = z
  .object({
    uuid: z.string().uuid(),
    name: z.string(),
    status: z.enum(CLUB_STATUSES),
    category: z.string(),
    affiliation: z.string(),
    short_description: z.string(),
    created_at: z.string(),
    manager: AdminClubManagerSchema,
  })
  .openapi('AdminClub')

export const AdminClubsResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      total_count: z.number().int(),
      clubs: z.array(AdminClubSchema),
    }),
  })
  .openapi('AdminClubsResponse')

export type AdminClubsResponse = z.infer<typeof AdminClubsResponseSchema>

const AdminClubDetailClubSchema = z
  .object({
    uuid: z.string().uuid(),
    status: z.enum(CLUB_STATUSES),
    name: z.string(),
    type: z.string(),
    category: z.string(),
    affiliation: z.string(),
    college_major_id: z.number().int().nullable(),
    short_description: z.string(),
    image_uri: z.string(),
    recruit_type: z.string().nullable(),
    min_activity_period: z.number().int(),
    has_dongbang: z.boolean(),
    dongbang_location: z.string(),
    sns: z.string(),
    introduction: z.string().nullable(),
    created_at: z.string(),
    reject_reason: z.string().nullable(),
  })
  .openapi('AdminClubDetailClub')

const AdminClubDetailManagerSchema = AdminClubManagerSchema.extend({
  service_user_id: z.string(),
}).openapi('AdminClubDetailManager')

export const AdminClubDetailResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      club_data: AdminClubDetailClubSchema,
      manager_data: AdminClubDetailManagerSchema,
    }),
  })
  .openapi('AdminClubDetailResponse')

export type AdminClubDetailResponse = z.infer<typeof AdminClubDetailResponseSchema>

export const AdminClubStatusUpdateSchema = z
  .object({
    status: z.enum(CLUB_STATUSES),
    reject_reason: z.string().trim().max(300).optional(),
    is_official_verified: z.boolean(),
  })
  .superRefine(({ status, reject_reason }, ctx) => {
    if (status === REJECTED_CLUB_STATUS && !reject_reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reject_reason'],
        message: 'reject_reason is required when status is REJECTED',
      })
    }
  })
  .openapi('AdminClubStatusUpdate')

export type AdminClubStatusUpdate = z.infer<typeof AdminClubStatusUpdateSchema>

export const AdminClubStatusUpdateResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      club_uuid: z.string().uuid(),
      status: z.enum(CLUB_STATUSES),
      processed_at: z.string(),
    }),
  })
  .openapi('AdminClubStatusUpdateResponse')

export type AdminClubStatusUpdateResponse = z.infer<typeof AdminClubStatusUpdateResponseSchema>

export const AdminClubHistoriesQuerySchema = z
  .object({
    club_uuid: z.string().uuid().optional(),
    query: z.string().trim().optional(),
    offset: z
      .preprocess(
        (value) => (value === undefined ? undefined : Number(value)),
        z.number().int().min(0),
      )
      .optional()
      .default(0),
    limit: z
      .preprocess(
        (value) => (value === undefined ? undefined : Number(value)),
        z.number().int().min(1).max(100),
      )
      .optional()
      .default(20),
  })
  .openapi('AdminClubHistoriesQuery')

export type AdminClubHistoriesQuery = z.infer<typeof AdminClubHistoriesQuerySchema>

const AdminClubHistorySnapshotSchema = z.record(z.unknown()).openapi('AdminClubHistorySnapshot')

const AdminClubHistorySchema = z
  .object({
    id: z.number().int(),
    club_uuid: z.string().uuid(),
    club_name: z.string(),
    updated_by: z.object({
      service_user_id: z.string().uuid(),
      name: z.string(),
    }),
    changed_fields: z.array(z.string()),
    before_data: AdminClubHistorySnapshotSchema,
    after_data: AdminClubHistorySnapshotSchema,
    created_at: z.string(),
  })
  .openapi('AdminClubHistory')

export const AdminClubHistoriesResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      total_count: z.number().int(),
      histories: z.array(AdminClubHistorySchema),
    }),
  })
  .openapi('AdminClubHistoriesResponse')

export type AdminClubHistoriesResponse = z.infer<typeof AdminClubHistoriesResponseSchema>

export const AdminClubManagerRequestsQuerySchema = z
  .object({
    status: z.enum(CLUB_STATUSES).optional(),
  })
  .openapi('AdminClubManagerRequestsQuery')

export type AdminClubManagerRequestsQuery = z.infer<typeof AdminClubManagerRequestsQuerySchema>

const AdminClubManagerRequestSchema = z
  .object({
    id: z.number().int(),
    club_uuid: z.string().uuid(),
    club_name: z.string(),
    applicant: z.object({
      service_user_id: z.string().uuid(),
      name: z.string(),
      phone: z.string(),
      student_id: z.string(),
    }),
    status: z.enum(CLUB_STATUSES),
    reject_reason: z.string().nullable(),
    created_at: z.string(),
  })
  .openapi('AdminClubManagerRequest')

export const AdminClubManagerRequestsResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      total_count: z.number().int(),
      requests: z.array(AdminClubManagerRequestSchema),
    }),
  })
  .openapi('AdminClubManagerRequestsResponse')

export type AdminClubManagerRequestsResponse = z.infer<
  typeof AdminClubManagerRequestsResponseSchema
>

export const AdminClubVerificationRequestsQuerySchema = z
  .object({
    status: z.enum(CLUB_STATUSES).optional(),
  })
  .openapi('AdminClubVerificationRequestsQuery')

export type AdminClubVerificationRequestsQuery = z.infer<
  typeof AdminClubVerificationRequestsQuerySchema
>

const AdminClubVerificationRequestSchema = z
  .object({
    id: z.number().int(),
    club_uuid: z.string().uuid(),
    club_name: z.string(),
    category: z.string(),
    status: z.enum(CLUB_STATUSES),
    reject_reason: z.string().nullable(),
    created_at: z.string(),
  })
  .openapi('AdminClubVerificationRequest')

export const AdminClubVerificationRequestsResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      total_count: z.number().int(),
      requests: z.array(AdminClubVerificationRequestSchema),
    }),
  })
  .openapi('AdminClubVerificationRequestsResponse')

export type AdminClubVerificationRequestsResponse = z.infer<
  typeof AdminClubVerificationRequestsResponseSchema
>

export const AdminClubManagerRequestStatusParamsSchema = z
  .object({
    id: z.preprocess((value) => Number(value), z.number().int().positive()),
  })
  .openapi('AdminClubManagerRequestStatusParams')

export type AdminClubManagerRequestStatusParams = z.infer<
  typeof AdminClubManagerRequestStatusParamsSchema
>

export const AdminClubManagerRequestStatusUpdateSchema = z
  .object({
    status: z.enum(CLUB_STATUSES),
    reject_reason: z.string().trim().max(300).optional(),
  })
  .superRefine(({ status, reject_reason }, ctx) => {
    if (status === REJECTED_CLUB_STATUS && !reject_reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reject_reason'],
        message: 'reject_reason is required when status is REJECTED',
      })
    }
  })
  .openapi('AdminClubManagerRequestStatusUpdate')

export type AdminClubManagerRequestStatusUpdate = z.infer<
  typeof AdminClubManagerRequestStatusUpdateSchema
>

export const AdminClubManagerRequestStatusUpdateResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      request_id: z.number().int(),
      club_uuid: z.string().uuid(),
      status: z.enum(CLUB_STATUSES),
      processed_at: z.string(),
    }),
  })
  .openapi('AdminClubManagerRequestStatusUpdateResponse')

export type AdminClubManagerRequestStatusUpdateResponse = z.infer<
  typeof AdminClubManagerRequestStatusUpdateResponseSchema
>

export const AdminClubVerificationRequestStatusParamsSchema = z
  .object({
    id: z.preprocess((value) => Number(value), z.number().int().positive()),
  })
  .openapi('AdminClubVerificationRequestStatusParams')

export type AdminClubVerificationRequestStatusParams = z.infer<
  typeof AdminClubVerificationRequestStatusParamsSchema
>

export const AdminClubVerificationRequestStatusUpdateSchema = z
  .object({
    status: z.enum(CLUB_STATUSES),
    reject_reason: z.string().trim().max(300).optional(),
  })
  .openapi('AdminClubVerificationRequestStatusUpdate')

export type AdminClubVerificationRequestStatusUpdate = z.infer<
  typeof AdminClubVerificationRequestStatusUpdateSchema
>

export const AdminClubVerificationRequestStatusUpdateResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      request_id: z.number().int(),
      club_uuid: z.string().uuid(),
      status: z.enum(CLUB_STATUSES),
      is_official_verified: z.boolean(),
      processed_at: z.string(),
    }),
  })
  .openapi('AdminClubVerificationRequestStatusUpdateResponse')

export type AdminClubVerificationRequestStatusUpdateResponse = z.infer<
  typeof AdminClubVerificationRequestStatusUpdateResponseSchema
>
