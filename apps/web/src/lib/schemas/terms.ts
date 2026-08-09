import { z } from 'src/lib/schemas/zod'
import { TermsSchema } from './common'

export const AgreeTermsSchema = z
  .object({
    termUuids: z.array(z.string().uuid()),
  })
  .openapi('AgreeTerms')
export const TermsResponseSchema = z
  .object({
    data: z.array(TermsSchema),
  })
  .openapi('TermsResponse')
