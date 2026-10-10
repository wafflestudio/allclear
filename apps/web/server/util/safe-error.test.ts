import { QueryFailedError } from 'typeorm'
import { describe, expect, it } from 'vitest'
import { Prisma } from '../infra/database/generated/prisma/client'
import { getSafeDatabaseErrorContext, getSafeErrorName } from './safe-error'

describe('safe error logging', () => {
  it('keeps an allowlisted error name without logging its message', () => {
    const error = Object.assign(new Error('accessToken=secret-value'), {
      name: 'AxiosError',
    })

    expect(getSafeErrorName(error)).toBe('AxiosError')
  })

  it('rejects an attacker-controlled error name', () => {
    const error = Object.assign(new Error('secret-value'), {
      name: 'token=secret-value',
    })

    expect(getSafeErrorName(error)).toBe('UnknownError')
  })

  it('returns only PostgreSQL code and constraint metadata', () => {
    const error = new QueryFailedError(
      'INSERT accessToken=secret-value',
      ['secret-value'],
      Object.assign(new Error('unique violation'), {
        code: '23505',
        constraint: 'uq_club_manager_active_club',
        detail: 'sensitive database row',
      }),
    )

    const context = getSafeDatabaseErrorContext(error)

    expect(context).toEqual({
      errorName: 'QueryFailedError',
      databaseCode: '23505',
      constraint: 'uq_club_manager_active_club',
    })
    expect(JSON.stringify(context)).not.toContain('secret-value')
    expect(JSON.stringify(context)).not.toContain('sensitive database row')
  })

  it('returns only allowlisted Prisma error metadata', () => {
    const error = new Prisma.PrismaClientKnownRequestError('accessToken=secret-value', {
      code: 'P2002',
      clientVersion: '7.10.0',
      meta: {
        target: 'uq_club_manager_active_club',
        detail: 'sensitive database row',
      },
    })

    const context = getSafeDatabaseErrorContext(error)

    expect(context).toEqual({
      errorName: 'PrismaClientKnownRequestError',
      prismaCode: 'P2002',
      constraint: 'uq_club_manager_active_club',
    })
    expect(JSON.stringify(context)).not.toContain('secret-value')
    expect(JSON.stringify(context)).not.toContain('sensitive database row')
  })

  it('reads a Prisma driver adapter constraint without logging other adapter details', () => {
    const error = new Prisma.PrismaClientKnownRequestError('secret-value', {
      code: 'P2002',
      clientVersion: '7.10.0',
      meta: {
        target: ['club_id'],
        driverAdapterError: {
          cause: {
            constraint: { index: 'uq_club_manager_active_club' },
            originalMessage: 'sensitive database row',
          },
        },
      },
    })

    expect(getSafeDatabaseErrorContext(error)).toEqual({
      errorName: 'PrismaClientKnownRequestError',
      prismaCode: 'P2002',
      constraint: 'uq_club_manager_active_club',
    })
  })
})
