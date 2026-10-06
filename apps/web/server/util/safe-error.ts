import { QueryFailedError } from 'typeorm'

const SAFE_ERROR_NAME = /^[A-Za-z][A-Za-z0-9]{0,63}$/
const SAFE_DATABASE_CODE = /^[A-Z0-9]{5}$/
const SAFE_DATABASE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/

export type SafeDatabaseErrorContext = {
  errorName: string
  databaseCode?: string
  constraint?: string
}

export const getSafeErrorName = (error: unknown): string => {
  if (!(error instanceof Error) || !SAFE_ERROR_NAME.test(error.name)) {
    return 'UnknownError'
  }
  return error.name
}

export const getSafeDatabaseErrorContext = (error: unknown): SafeDatabaseErrorContext => {
  const context: SafeDatabaseErrorContext = { errorName: getSafeErrorName(error) }
  if (!(error instanceof QueryFailedError)) {
    return context
  }

  const driverError = (
    error as QueryFailedError & {
      driverError?: { code?: unknown; constraint?: unknown }
    }
  ).driverError
  if (typeof driverError?.code === 'string' && SAFE_DATABASE_CODE.test(driverError.code)) {
    context.databaseCode = driverError.code
  }
  if (
    typeof driverError?.constraint === 'string' &&
    SAFE_DATABASE_IDENTIFIER.test(driverError.constraint)
  ) {
    context.constraint = driverError.constraint
  }
  return context
}
