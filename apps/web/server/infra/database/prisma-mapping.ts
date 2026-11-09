/** Preserve string IDs in API responses for BIGINT columns. */
export const toDatabaseIdString = (value: bigint | number | string): string => String(value)

/** Prisma returns Date objects; the API exposes timestamps as strings. */
export const toTimestampString = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value

export const toNullableTimestampString = (value: Date | string | null): string | null =>
  value == null ? null : toTimestampString(value)

/** PostgreSQL DATE values are exposed without a time component. */
export const toDateString = (value: Date | string): string =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value

export const toNullableDateString = (value: Date | string | null): string | null =>
  value == null ? null : toDateString(value)

/** JSON columns used for URL lists must contain strings. */
export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new TypeError('Expected a JSON array of strings')
  }
  return value
}
