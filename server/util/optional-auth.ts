import { NextApiRequest } from 'next'
import * as jose from 'jose'
import { ENV } from 'server/ENV'
import { BadRequestError, UnauthorizedError } from 'server/domain/error'
import { validate as validateUuid } from 'uuid'

type MemberAuth = {
  type: 'member'
  accountId: string
}

type GuestAuthWithId = {
  type: 'guest'
  guestId: string
}

export type OptionalAuth = MemberAuth | GuestAuthWithId

export async function resolveOptionalAuth(req: NextApiRequest): Promise<OptionalAuth> {
  const authorizationHeader = req.headers.authorization ?? req.headers['x-authorization']
  if (!authorizationHeader) {
    return {
      type: 'guest',
      guestId: parseGuestId(req),
    }
  }
  if (Array.isArray(authorizationHeader)) {
    throw new UnauthorizedError('unauthorized')
  }

  const token = authorizationHeader.split(' ')[1]
  if (!token) {
    throw new UnauthorizedError('unauthorized')
  }

  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(ENV.JWT.SECRET_KEY), {
      algorithms: ['HS256'],
    })
    const accountId = payload.sub
    if (!accountId) {
      throw new UnauthorizedError('unauthorized')
    }
    return {
      type: 'member',
      accountId,
    }
  } catch (err) {
    throw new UnauthorizedError('unauthorized')
  }
}

function parseGuestId(req: NextApiRequest): string {
  const value = req.headers['x-guest-id']
  if (!value) {
    throw new BadRequestError('guest id is required')
  }
  if (Array.isArray(value) || !validateUuid(value)) {
    throw new BadRequestError('invalid guest id')
  }
  return value
}
