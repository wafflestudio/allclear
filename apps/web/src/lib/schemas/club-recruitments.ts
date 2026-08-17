import {
  CLUB_RECRUITMENT_ACTIVITY_LOCATION_TYPES,
  REGULAR_MEETING_DAYS,
} from 'src/common/constants/club-recruitment'
import { z } from 'src/lib/schemas/zod'

const TimestampStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'Invalid datetime string',
  })

const BooleanInputSchema = z.preprocess((value) => {
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  return value
}, z.boolean())

const RequiredStringSchema = z.string().trim().min(1)

const TrimmedStringSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return ''
  }
  return typeof value === 'string' ? value.trim() : value
}, z.string())

const NullableTrimmedStringSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().trim().nullable(),
)

export const RegularMeetingSchema = z
  .object({
    id: z.string().regex(/^\d+$/).optional(),
    dayOfWeek: z.enum(REGULAR_MEETING_DAYS),
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
  })
  .openapi('RegularMeeting')

export const UpsertRegularMeetingSchema = z
  .object({
    day_of_week: z.enum(REGULAR_MEETING_DAYS),
    start_time: z.string().nullable(),
    end_time: z.string().nullable(),
  })
  .openapi('UpsertRegularMeeting')

export const ClubRecruitmentParamsSchema = z
  .object({
    uuid: z.string().uuid(),
  })
  .openapi('ClubRecruitmentParams')

export const RecruitmentIdParamsSchema = z
  .object({
    recruitmentId: z.string().regex(/^\d+$/),
  })
  .openapi('RecruitmentIdParams')

export const CreateClubRecruitmentSchema = z
  .object({
    title: RequiredStringSchema,
    deadline: TimestampStringSchema,
    is_mandatory: BooleanInputSchema,
    has_regular_meeting: BooleanInputSchema,
    regular_meetings: z.array(UpsertRegularMeetingSchema).optional().default([]),
    activity_location_type: z.enum(CLUB_RECRUITMENT_ACTIVITY_LOCATION_TYPES),
    activity_location_text: TrimmedStringSchema.optional().default(''),
    has_eligibility: BooleanInputSchema,
    eligibility_text: TrimmedStringSchema.optional().default(''),
    has_capacity_limit: BooleanInputSchema,
    capacity_limit_text: TrimmedStringSchema.optional().default(''),
    has_membership_fee: BooleanInputSchema,
    membership_fee_text: TrimmedStringSchema.optional().default(''),
    application_url: RequiredStringSchema,
    application_process: RequiredStringSchema,
    full_recruitment_text: NullableTrimmedStringSchema.optional().default(null),
    image_urls: z.array(z.string()).optional().default([]),
  })
  .openapi('CreateClubRecruitment')

export type CreateClubRecruitment = z.infer<typeof CreateClubRecruitmentSchema>

export const UpdateClubRecruitmentSchema = z
  .object({
    title: RequiredStringSchema.optional(),
    deadline: TimestampStringSchema.optional(),
    is_mandatory: BooleanInputSchema.optional(),
    has_regular_meeting: BooleanInputSchema.optional(),
    regular_meetings: z.array(UpsertRegularMeetingSchema).optional(),
    activity_location_type: z.enum(CLUB_RECRUITMENT_ACTIVITY_LOCATION_TYPES).optional(),
    activity_location_text: TrimmedStringSchema.optional(),
    has_eligibility: BooleanInputSchema.optional(),
    eligibility_text: TrimmedStringSchema.optional(),
    has_capacity_limit: BooleanInputSchema.optional(),
    capacity_limit_text: TrimmedStringSchema.optional(),
    has_membership_fee: BooleanInputSchema.optional(),
    membership_fee_text: TrimmedStringSchema.optional(),
    application_url: RequiredStringSchema.optional(),
    application_process: RequiredStringSchema.optional(),
    full_recruitment_text: NullableTrimmedStringSchema.optional(),
    image_urls: z.array(z.string()).optional(),
  })
  .openapi('UpdateClubRecruitment')

export type UpdateClubRecruitment = z.infer<typeof UpdateClubRecruitmentSchema>

export const CreateRecruitmentResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
      recruitment_id: z.number().int(),
      club_uuid: z.string().uuid(),
      year_month: z.string().regex(/^\d{4}-\d{2}$/),
      deadline: z.string(),
    }),
  })
  .openapi('CreateRecruitmentResponse')

export type CreateRecruitmentResponse = z.infer<typeof CreateRecruitmentResponseSchema>

export const UpdateRecruitmentResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
      recruitment_id: z.number().int(),
      club_uuid: z.string().uuid(),
      year_month: z.string().regex(/^\d{4}-\d{2}$/),
      deadline: z.string(),
      updated_at: z.string(),
    }),
  })
  .openapi('UpdateRecruitmentResponse')

export type UpdateRecruitmentResponse = z.infer<typeof UpdateRecruitmentResponseSchema>

export const ClubRecruitmentSchema = z
  .object({
    id: z.string().regex(/^\d+$/),
    clubId: z.string().uuid(),
    title: z.string(),
    deadline: z.string(),
    isMandatory: z.boolean(),
    hasRegularMeeting: z.boolean(),
    regularMeetings: z.array(RegularMeetingSchema.required({ id: true })),
    activityLocationType: z.enum(CLUB_RECRUITMENT_ACTIVITY_LOCATION_TYPES),
    activityLocationText: z.string(),
    hasEligibility: z.boolean(),
    eligibilityText: z.string(),
    hasCapacityLimit: z.boolean(),
    capacityLimitText: z.string(),
    hasMembershipFee: z.boolean(),
    membershipFeeText: z.string(),
    applicationUrl: z.string(),
    applicationProcess: z.string(),
    fullRecruitmentText: z.string().nullable(),
    imageUrls: z.array(z.string()),
    yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('ClubRecruitment')

export type ClubRecruitmentDto = z.infer<typeof ClubRecruitmentSchema>

export const ClubRecruitmentsResponseSchema = z
  .object({
    recruitments: z.array(ClubRecruitmentSchema),
    totalSize: z.number().int(),
  })
  .openapi('ClubRecruitmentsResponse')

export type ClubRecruitmentsResponse = z.infer<typeof ClubRecruitmentsResponseSchema>

export const PublicClubRecruitmentListItemSchema = z
  .object({
    id: z.number().int(),
    display_title: z.string(),
    title: z.string(),
    deadline: z.string(),
    is_active: z.boolean(),
  })
  .openapi('PublicClubRecruitmentListItem')

export const PublicClubRecruitmentsResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      club_name: z.string(),
      recruitments: z.array(PublicClubRecruitmentListItemSchema),
    }),
  })
  .openapi('PublicClubRecruitmentsResponse')

export type PublicClubRecruitmentsResponse = z.infer<typeof PublicClubRecruitmentsResponseSchema>

export const PublicClubRecruitmentDetailResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      id: z.number().int(),
      display_title: z.string(),
      club_id: z.string().uuid(),
      content: z.object({
        title: z.string(),
        deadline: z.string(),
        is_mandatory: z.boolean(),
        has_regular_meeting: z.boolean(),
        regular_meetings: z.array(UpsertRegularMeetingSchema),
        activity_location_type: z.enum(CLUB_RECRUITMENT_ACTIVITY_LOCATION_TYPES),
        activity_location_text: z.string(),
        has_eligibility: z.boolean(),
        eligibility_text: z.string(),
        has_capacity_limit: z.boolean(),
        capacity_limit_text: z.string(),
        has_membership_fee: z.boolean(),
        membership_fee_text: z.string(),
        application_url: z.string(),
        application_process: z.string(),
        full_recruitment_text: z.string().nullable(),
        image_urls: z.array(z.string()),
      }),
    }),
  })
  .openapi('PublicClubRecruitmentDetailResponse')

export type PublicClubRecruitmentDetailResponse = z.infer<
  typeof PublicClubRecruitmentDetailResponseSchema
>
