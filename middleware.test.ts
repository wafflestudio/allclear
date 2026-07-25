import { SignJWT } from 'jose'
import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import { config, middleware } from './middleware'

const jwtSecret = 'test-secret-with-at-least-32-bytes'
const accountId = '123e4567-e89b-12d3-a456-426614174000'
const managerApiUrl =
  'http://localhost:3000/api/v2/managers/me/clubs/123e4567-e89b-12d3-a456-426614174001/manager'

vi.mock('./server/ENV', () => ({
  ENV: {
    JWT: {
      SECRET_KEY: 'test-secret-with-at-least-32-bytes',
    },
  },
}))

async function createToken() {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(accountId)
    .sign(new TextEncoder().encode(jwtSecret))
}

describe('authentication middleware routes', () => {
  it('authenticates club activity image uploads', () => {
    expect(config.matcher).toContain('/api/v2/managers/me/clubs/:uuid?/activity-images')
  })

  it('matches the club registration manager API', () => {
    expect(config.matcher).toContain('/api/v2/managers/me/clubs/:uuid/manager')
  })

  it.each(['GET', 'PATCH'])(
    'passes authenticated %s requests to the club registration manager API',
    async (method) => {
      const token = await createToken()
      const response = await middleware(
        new NextRequest(managerApiUrl, {
          method,
          headers: {
            authorization: `Bearer ${token}`,
          },
        }),
        {} as never,
      )

      expect(response).toBeDefined()
      if (!response) throw new Error('middleware response is required')
      expect(response.status).toBe(200)
      expect(response.headers.get('x-middleware-request-user')).toBe(accountId)
    },
  )

  it.each(['GET', 'PATCH'])(
    'rejects unauthenticated %s requests to the club registration manager API',
    async (method) => {
      const response = await middleware(
        new NextRequest(managerApiUrl, {
          method,
        }),
        {} as never,
      )

      expect(response).toBeDefined()
      if (!response) throw new Error('middleware response is required')
      expect(response.status).toBe(401)
    },
  )
})
