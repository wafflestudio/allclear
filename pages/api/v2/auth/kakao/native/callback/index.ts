import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import type { ZodIssue } from 'zod'
import { Provider } from 'server/provider'
import { AuthService } from 'server/service/auth.service'
import { ENV } from 'server/ENV'
import { KakaoNativeCallbackPayloadSchema } from 'src/lib/schemas/auth'

type ResponseData = {
  token: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string | ZodIssue[]>,
) {
  try {
    const authService = Provider.getService(AuthService)

    if (req.method == 'POST') {
      const { accessToken } = KakaoNativeCallbackPayloadSchema.parse(req.body)
      console.log(accessToken)
      if (!accessToken) {
        return res.status(401).send('Unauthorized')
      }
      const accountId = await authService.getOrCreateKakaoUser(accessToken)
      try {
        const token = jwt.sign({ sub: accountId }, ENV.JWT.SECRET_KEY, {
          algorithm: 'HS256',
          expiresIn: '1y',
        })
        return res.status(200).json({
          token,
        })
      } catch (err) {
        console.error('kakaoLoginNativeCallback jwt.sign error', err)
        return res.status(500).send('Internal Server Error')
      }
    }
    return res.status(405).send('method not allowed')
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('kakaoLoginNativeCallback error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
