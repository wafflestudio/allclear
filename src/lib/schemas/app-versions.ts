import { z } from 'src/lib/schemas/zod'

export const AppClientTypeSchema = z.enum(['android', 'ios']).openapi('AppClientType')

export const AppVersionStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+){0,3}$/, 'version must be numeric dot-separated string')
  .openapi('AppVersionString')

export const AppVersionCheckSchema = z
  .object({
    clientType: AppClientTypeSchema,
    appVersion: AppVersionStringSchema,
  })
  .openapi('AppVersionCheck')

export type AppVersionCheck = z.infer<typeof AppVersionCheckSchema>

export const AppVersionPolicyUpdateSchema = z
  .object({
    clientType: AppClientTypeSchema,
    minSupportedVersion: AppVersionStringSchema,
  })
  .openapi('AppVersionPolicyUpdate')

export type AppVersionPolicyUpdate = z.infer<typeof AppVersionPolicyUpdateSchema>

export const AppVersionCheckResponseSchema = z
  .object({
    updateRequired: z.boolean(),
    clientType: AppClientTypeSchema,
    minSupportedVersion: AppVersionStringSchema,
    storeUrl: z.string().url(),
  })
  .openapi('AppVersionCheckResponse')

export type AppVersionCheckResponse = z.infer<typeof AppVersionCheckResponseSchema>

export const AppVersionPolicyResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      clientType: AppClientTypeSchema,
      minSupportedVersion: AppVersionStringSchema,
    }),
  })
  .openapi('AppVersionPolicyResponse')

export type AppVersionPolicyResponse = z.infer<typeof AppVersionPolicyResponseSchema>
