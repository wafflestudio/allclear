const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((element) => typeof element === 'string')

interface Headers {
  get(name: string): string | string[] | null | undefined
}
export const bearerToken = (headers: Headers): string | null => {
  const bearerToken = headers.get('authorization') ?? headers.get('x-authorization')

  if (!bearerToken) {
    return null
  }
  if (isStringArray(bearerToken)) {
    return null
  }

  const token = bearerToken.split(' ')[1]
  if (!token) {
    return null
  }

  return token
}
