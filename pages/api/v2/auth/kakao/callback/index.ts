import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import type { ZodIssue } from 'zod'
import { ENV } from 'server/ENV'
import { Provider } from 'server/provider'
import { AuthService } from 'server/service/auth.service'
import { KakaoCallbackQuerySchema } from 'src/lib/schemas/auth'

type ResponseData = {
  token: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string | ZodIssue[]>,
) {
  try {
    const authService = Provider.getService(AuthService)

    if (req.method == 'GET') {
      const { code: authcode } = KakaoCallbackQuerySchema.parse(req.query)
      if (!authcode) {
        return res.status(401).send('unauthorized')
      }
      const accessToken = await authService.getKakaoAccessToken(authcode)
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
        console.error('kakaoLoginCallback jwt.sign error', err)
        return res.status(500).send('Internal Server Error')
      }
    }
    return res.status(405).send('method not allowed')
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('kakaoLoginCallback error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
