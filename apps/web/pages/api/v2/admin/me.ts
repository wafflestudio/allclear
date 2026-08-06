import type { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { UserService } from 'server/service/user.service'
import { ForbiddenError } from 'server/domain/error'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userService = Provider.getService(UserService)
    await userService.assertAdminRole(req.headers.user as string)
    return res.status(200).json({ ok: true })
  } catch (err) {
    if (err instanceof ForbiddenError) return res.status(403).send('Forbidden')
    return res.status(500).send('Internal Server Error')
  }
}
