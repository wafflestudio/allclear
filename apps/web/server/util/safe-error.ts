import { Prisma } from '../infra/database/generated/prisma/client'

const SAFE_ERROR_NAME = /^[A-Za-z][A-Za-z0-9]{0,63}$/
const SAFE_DATABASE_CODE = /^[A-Z0-9]{5}$/
const SAFE_DATABASE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/
const SAFE_PRISMA_CODE = /^P[0-9]{4}$/

export type SafeDatabaseErrorContext = {
  errorName: string
  databaseCode?: string
  prismaCode?: string
  constraint?: string
}

export const getSafeErrorName = (error: unknown): string => {
  if (!(error instanceof Error) || !SAFE_ERROR_NAME.test(error.name)) {
    return 'UnknownError'
  }
  return error.name
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getPrismaConstraint = (meta: Record<string, unknown> | undefined): string | undefined => {
  if (typeof meta?.target === 'string' && SAFE_DATABASE_IDENTIFIER.test(meta.target)) {
    return meta.target
  }

  const adapterError = meta?.driverAdapterError
  const cause = isRecord(adapterError) ? adapterError.cause : undefined
  const constraint = isRecord(cause) ? cause.constraint : undefined
  const index = isRecord(constraint) ? constraint.index : undefined
  return typeof index === 'string' && SAFE_DATABASE_IDENTIFIER.test(index) ? index : undefined
}

export const getSafeDatabaseErrorContext = (error: unknown): SafeDatabaseErrorContext => {
  const context: SafeDatabaseErrorContext = { errorName: getSafeErrorName(error) }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (SAFE_PRISMA_CODE.test(error.code)) {
      context.prismaCode = error.code
    }
    const constraint = getPrismaConstraint(error.meta)
    if (constraint) {
      context.constraint = constraint
    }
    return context
  }
  if (!(error instanceof Error)) {
    return context
  }

  const databaseError = error as Error & { code?: unknown; constraint?: unknown }
  if (typeof databaseError.code === 'string' && SAFE_DATABASE_CODE.test(databaseError.code)) {
    context.databaseCode = databaseError.code
  }
  if (
    typeof databaseError.constraint === 'string' &&
    SAFE_DATABASE_IDENTIFIER.test(databaseError.constraint)
  ) {
    context.constraint = databaseError.constraint
  }
  return context
}
