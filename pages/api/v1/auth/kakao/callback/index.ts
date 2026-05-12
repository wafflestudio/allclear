import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { ENV } from 'server/ENV'
import { Provider } from 'server/provider'
import { AuthServiceV1 } from 'server/service/v1/auth.service'

type ResponseData = {
  token: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const authService = Provider.getService(AuthServiceV1)

    if (req.method == 'GET') {
      const authcode = req.query.code as string
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
    console.error('kakaoLoginCallback error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
