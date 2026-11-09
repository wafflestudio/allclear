import { describe, expect, it } from 'vitest'
import {
  toDatabaseIdString,
  toDateString,
  toNullableDateString,
  toNullableTimestampString,
  toStringArray,
  toTimestampString,
} from './prisma-mapping'

describe('Prisma value mapping', () => {
  it('preserves IDs larger than the JavaScript safe integer range', () => {
    expect(toDatabaseIdString(BigInt('9007199254740993'))).toBe('9007199254740993')
  })

  it('maps Prisma dates to the existing timestamp and date-only response shapes', () => {
    const value = new Date('2026-10-11T23:30:00.000Z')
    expect(toTimestampString(value)).toBe('2026-10-11T23:30:00.000Z')
    expect(toDateString(value)).toBe('2026-10-11')
    expect(toNullableTimestampString(null)).toBeNull()
    expect(toNullableDateString(null)).toBeNull()
  })

  it('accepts URL arrays and rejects other JSON values', () => {
    expect(toStringArray(['https://example.com'])).toEqual(['https://example.com'])
    expect(() => toStringArray({ url: 'https://example.com' })).toThrow(TypeError)
    expect(() => toStringArray([1])).toThrow(TypeError)
  })
})
