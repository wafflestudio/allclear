import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { Provider } from 'server/provider'
import { AuthServiceV1 } from 'server/service/v1/auth.service'
import { ENV } from 'server/ENV'

type ResponseData = {
  token: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const authService = Provider.getService(AuthServiceV1)

    if (req.method == 'POST') {
      const accessToken = req.body.accessToken as string
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
    console.error('kakaoLoginNativeCallback error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
