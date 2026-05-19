import { z } from 'src/lib/schemas/zod'
import { ClubSchema, UserSchema, CollegeMajorSchema } from 'src/lib/schemas/common'

export const UpdateProfileSchema = z
  .object({
    nickname: z.string().max(32).optional(),
    name: z.string().max(32).optional(),
    email: z.string().max(80).optional(),
    gender: z.enum(['F', 'M']).optional(),
    birthDate: z.string().max(10).nullable().optional(),
    birthYear: z.string().min(4).max(4).optional(),
    college: z.string().max(40).optional(),
    major: z.string().max(40).optional(),
    collegeMajorId: z.number().nullable().optional(),
    admissionClass: z.number().nullable().optional(),
    grade: z.number().nullable().optional(),
  })
  .openapi('UpdateProfile')

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>

export const UpdateDeviceSchema = z
  .object({
    pushId: z.string().uuid(),
    appVersion: z.string().optional(),
    info: z.any().optional(),
  })
  .openapi('UpdateDevice')

export const UserVoiceSchema = z
  .object({
    content: z.string().nonempty(),
  })
  .openapi('UserVoice')

export const DownloadAppLogQuerySchema = z
  .object({
    userAgent: z.string().optional(),
  })
  .catchall(z.string())
  .openapi('DownloadAppLogQuery')

export const UserProfileResponseSchema = z
  .object({
    profile: UserSchema,
  })
  .openapi('UserProfileResponse')

export const UserClubsResponseSchema = z
  .object({
    clubs: z.array(ClubSchema),
    totalSize: z.number().int(),
  })
  .openapi('UserClubsResponse')

export const CollegeMajorsQuerySchema = z
  .object({
    includeNullMajor: z.enum(['true', 'false']).optional(),
  })
  .openapi('CollegeMajorsQuery')

export const CollegeMajorsResponseSchema = z
  .object({
    majors: z.array(CollegeMajorSchema),
    totalSize: z.number().int(),
  })
  .openapi('CollegeMajorsResponse')

export const GuestIdHeaderSchema = z
  .object({
    'x-guest-id': z.string().uuid().optional(),
  })
  .openapi('GuestIdHeader')

export const RecentSearchSchema = z
  .object({
    query: z.string(),
    searchedAt: z.string(),
  })
  .openapi('RecentSearch')

export const RecentSearchesResponseSchema = z
  .object({
    recentSearches: z.array(RecentSearchSchema),
    totalSize: z.number().int(),
  })
  .openapi('RecentSearchesResponse')
