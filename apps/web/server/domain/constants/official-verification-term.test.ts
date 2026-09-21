import { describe, expect, it } from 'vitest'
import { getOfficialVerificationTermKey } from './official-verification-term'

describe('getOfficialVerificationTermKey', () => {
  it.each([
    ['2026-02-28T14:59:59.999Z', '2025-2'],
    ['2026-02-28T15:00:00.000Z', '2026-1'],
    ['2026-08-31T14:59:59.999Z', '2026-1'],
    ['2026-08-31T15:00:00.000Z', '2026-2'],
    ['2026-12-31T15:00:00.000Z', '2026-2'],
  ])('%s는 서울 시간 기준 %s 학기다', (date, expectedTermKey) => {
    expect(getOfficialVerificationTermKey(new Date(date))).toBe(expectedTermKey)
  })
})
