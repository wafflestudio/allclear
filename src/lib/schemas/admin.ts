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
