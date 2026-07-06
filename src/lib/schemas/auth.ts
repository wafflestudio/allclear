import { z } from 'src/lib/schemas/zod'

export const AppleLoginCallbackPayloadSchema = z
  .object({
    id_token: z.string(),
    user: z.string().optional(),
  })
  .openapi('AppleLoginCallbackPayload')

export const KakaoCallbackQuerySchema = z
  .object({
    code: z.string(),
    state: z.string().optional(),
  })
  .openapi('KakaoCallbackQuery')

export const KakaoNativeCallbackPayloadSchema = z
  .object({
    accessToken: z.string(),
  })
  .openapi('KakaoNativeCallbackPayload')
