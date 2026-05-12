import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import type { ZodIssue } from 'zod'
import { Provider } from 'server/provider'
import { AuthService } from 'server/service/auth.service'
import { ENV } from 'server/ENV'
import { AppleLoginCallbackPayloadSchema } from 'src/lib/schemas/auth'

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
      const payload = AppleLoginCallbackPayloadSchema.parse(req.body)
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
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('appleLoginNativeCallback error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
