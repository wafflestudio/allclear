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
    '/api/v2/users/me',
    '/api/v2/users/me/clubs',
    '/api/v2/users/me/clubs/saved',
    '/api/v2/users/me/devices',
    '/api/v2/users/me/notifications/:path*',
    '/api/v2/users/me/voices',
    '/api/v2/auth/leave',
    '/api/v2/terms',
    '/api/v2/terms/:path*',
    '/api/v2/announcements/dismiss',
    '/api/v2/clubs/:uuid?/reviews',
    '/api/v2/clubs/:uuid?/reviews/me',
    '/api/v2/clubs/:uuid?/saved',
    '/api/v2/clubs/register',
    '/api/v2/clubs/:uuid?/manager-requests',
    '/api/v2/managers/me/clubs',
    '/api/v2/managers/me/clubs/:uuid?',
    '/api/v2/managers/me/clubs/:uuid/manager',
    '/api/v2/managers/me/clubs/:uuid?/recruitments',
    '/api/v2/managers/me/clubs/:uuid?/recruitments/images',
    '/api/v2/managers/me/clubs/:uuid?/images',
    '/api/v2/managers/me/clubs/:uuid?/activity-images',
    '/api/v2/managers/me/clubs/:uuid?/verifications',
    '/api/v2/managers/me/recruitments/:recruitmentId?',
    '/api/v2/admin/me',
    '/api/v2/admin/clubs',
    '/api/v2/admin/clubs/histories',
    '/api/v2/admin/clubs/manager-requests',
    '/api/v2/admin/clubs/manager-requests/:id/status',
    '/api/v2/admin/clubs/verifications',
    '/api/v2/admin/clubs/verifications/:id/status',
    '/api/v2/admin/clubs/:uuid?',
    '/api/v2/admin/clubs/:uuid?/status',
    '/api/v1/users/me',
    '/api/v1/users/me/clubs',
    '/api/v1/users/me/clubs/saved',
    '/api/v1/users/me/devices',
    '/api/v1/users/me/voices',
    '/api/v1/auth/leave',
    '/api/v1/clubs/:uuid?/reviews',
    '/api/v1/clubs/:uuid?/reviews/me',
    '/api/v1/clubs/:uuid?/saved',
    '/api/v1/managers/me/clubs',
    '/api/v1/managers/me/clubs/:uuid?',
    '/api/v1/managers/me/clubs/:uuid?/images',
  ],
}
