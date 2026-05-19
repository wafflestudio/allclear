import type { NextApiRequest, NextApiResponse } from 'next'
import { z, ZodIssue } from 'zod'
import { Provider } from 'server/provider'
import { TestAuthService, TestLoginResult } from 'server/service/test-auth.service'
import { isTestApiEnabled } from 'server/util/test-api'
import { TestLoginSchema } from 'src/lib/schemas/test'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestLoginResult | string | ZodIssue[]>,
) {
  if (!isTestApiEnabled()) {
    return res.status(404).send('not found')
  }

  try {
    if (req.method === 'POST') {
      const payload = TestLoginSchema.parse(req.body)
      const testAuthService = Provider.getService(TestAuthService)
      const loginResult = await testAuthService.login(payload)
      return res.status(200).json(loginResult)
    }

    return res.status(405).send('method not allowed')
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('testLogin error: ', err)
    return res.status(500).send('internal server error')
  }
}
