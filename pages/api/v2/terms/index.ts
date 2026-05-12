import { NextApiRequest, NextApiResponse } from 'next'
import { UserService } from 'server/service/user.service'
import { Provider } from 'server/provider'
import { UserNotFoundError } from 'server/domain/error'
import { Terms } from 'server/domain/model/Terms'
import { TermsService } from 'server/service/terms.service'

type ResponseData = {
  data: Terms[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const userService = Provider.getService(UserService)
    const termsService = Provider.getService(TermsService)

    if (req.method === 'GET') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const data = await termsService.listUnagreedTerms(user.id)
      return res.status(200).json({
        data,
      })
    }

    return res.status(405).send('method not allowed')
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    console.error('listTerms error: ', err)
    return res.status(500).send('internal server error')
  }
}
