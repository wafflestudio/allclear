import { NextMiddleware, NextResponse } from 'next/server'
import { ENV } from './server/ENV'
import * as jose from 'jose'
import { bearerToken } from './server/util/token'

export const middleware: NextMiddleware = async (req) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return NextResponse.json(
      { message: '서버 점검 중입니다. 잠시 후 다시 시도해주세요.' },
      { status: 503 },
    )
  }

  try {
    const token = bearerToken(req.headers)
    if (!token) {
      return new NextResponse('unauthorized', {
        status: 401,
      })
    }
    // edge runtime 호환되는 jose 사용
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(ENV.JWT.SECRET_KEY), {
      algorithms: ['HS256'],
    })
    const userId = payload.sub
    if (!userId) {
      return new NextResponse('unauthorized', {
        status: 401,
      })
    }
    const userHeader = new Headers(req.headers)
    userHeader.set('user', userId)
    return NextResponse.next({
      request: {
        headers: userHeader,
      },
    })
  } catch (err) {
    console.error(err)
    return new NextResponse('unauthorized', {
      status: 401,
    })
  }
}
export const config = {
  matcher: [
    '/api/v1/users/me',
    '/api/v1/users/me/clubs',
    '/api/v1/users/me/clubs/saved',
    '/api/v1/users/me/devices',
    '/api/v1/users/me/voices',
    '/api/v1/auth/leave',
    '/api/v1/terms',
    '/api/v1/clubs/:uuid?/reviews',
    '/api/v1/clubs/:uuid?/reviews/me',
    '/api/v1/clubs/:uuid?/saved',
    '/api/v1/clubs/register',
    '/api/v1/clubs/:uuid?/manager-requests',
    '/api/v1/managers/me/clubs',
    '/api/v1/managers/me/clubs/:uuid?',
    '/api/v1/managers/me/clubs/:uuid?/recruitments',
    '/api/v1/managers/me/clubs/:uuid?/images',
    '/api/v1/managers/me/clubs/:uuid?/verifications',
    '/api/v1/managers/me/recruitments/:recruitmentId?',
  ],
}
