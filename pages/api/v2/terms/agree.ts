import { NextApiRequest, NextApiResponse } from 'next'
import { ZodIssue, z } from 'zod'
import { Provider } from 'server/provider'
import { UserService } from 'server/service/user.service'
import { TermsService } from 'server/service/terms.service'
import { BadRequestError, UserNotFoundError } from 'server/domain/error'
import { AgreeTermsSchema } from 'src/lib/schemas/terms'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<null | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    const termsService = Provider.getService(TermsService)

    if (req.method === 'POST') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const body = AgreeTermsSchema.parse(req.body)
      await termsService.agreeToTerms(user.id, body.termUuids)
      return res.status(204).send(null)
    }

    return res.status(405).send('method not allowed')
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof BadRequestError) {
      return res.status(400).send(err.message)
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('agreeTerms error: ', err)
    return res.status(500).send('internal server error')
  }
}
