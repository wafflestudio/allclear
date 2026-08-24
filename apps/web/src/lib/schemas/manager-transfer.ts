import { z } from 'src/lib/schemas/zod'

const ManagerTransferClubSchema = z.object({
  club_uuid: z.string().uuid(),
  club_name: z.string().min(1),
})

export const ManagerTransferTokenParamsSchema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  })
  .openapi('ManagerTransferTokenParams')

export const ManagerTransferInvitationCreateResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      transfer_url: z.string().url(),
      expires_at: z.string().datetime(),
    }),
  })
  .openapi('ManagerTransferInvitationCreateResponse')

export type ManagerTransferInvitationCreateResponse = z.infer<
  typeof ManagerTransferInvitationCreateResponseSchema
>

export const ManagerTransferInvitationResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: ManagerTransferClubSchema.extend({
      expires_at: z.string().datetime(),
    }),
  })
  .openapi('ManagerTransferInvitationResponse')

export type ManagerTransferInvitationResponse = z.infer<
  typeof ManagerTransferInvitationResponseSchema
>

export const ManagerTransferAcceptanceResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: ManagerTransferClubSchema,
  })
  .openapi('ManagerTransferAcceptanceResponse')

export type ManagerTransferAcceptanceResponse = z.infer<
  typeof ManagerTransferAcceptanceResponseSchema
>
