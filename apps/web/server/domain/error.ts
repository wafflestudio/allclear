export const BadRequestError = class extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export const NotFoundError = class extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export const UserNotFoundError = class extends NotFoundError {
  constructor(message: string) {
    super(message)
    this.name = 'UserNotFoundError'
  }
}
