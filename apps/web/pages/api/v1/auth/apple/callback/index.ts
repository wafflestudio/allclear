import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { Provider } from 'server/provider'
import { AuthServiceV1 } from 'server/service/v1/auth.service'
import { ENV } from 'server/ENV'

type AppleLoginCallbackPayload = {
  id_token: string
  user?: string
}

type ResponseData = {
  token: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  const authService = Provider.getService(AuthServiceV1)

  if (req.method == 'POST') {
    const payload = req.body as AppleLoginCallbackPayload
    if (!payload.id_token) {
      return res.status(401).send('Unauthorized')
    }
    const decodedObj = jwt.decode(payload.id_token) as {
      sub?: string
      email?: string
    } | null
    if (!decodedObj) {
      console.error('appleLoginNativeCallback jwt.decode error', payload.id_token)
      return res.status(401).send('Unauthorized')
    }
    if (!decodedObj.sub) {
      console.error('appleLoginNativeCallback missing sub', decodedObj)
      return res.status(401).send('Unauthorized')
    }
    const accountId = await authService.createAppleUser({
      accountId: decodedObj.sub,
      email: decodedObj.email,
      user: payload.user,
    })
    return jwt.sign(
      { sub: accountId },
      ENV.JWT.SECRET_KEY,
      { algorithm: 'HS256', expiresIn: '1y' },
      (err, token) => {
        if (err || !token) {
          console.error('appleLoginNativeCallback jwt.sign error', err)
          return res.status(500).send('Internal Server Error')
        }
        return res.status(200).json({
          token,
        })
      },
    )
  }
  return res.status(405).send('method not allowed')
}
