import { describe, expect, it } from 'vitest'
import { getClubResubmissionStatusPatch } from './club-registration-status'

describe('club registration resubmission status', () => {
  it('returns a pending status patch for a rejected club', () => {
    expect(getClubResubmissionStatusPatch('REJECTED')).toEqual({
      status: 'PENDING',
      rejectReason: '',
    })
  })

  it('does not change the status of a non-rejected club', () => {
    expect(getClubResubmissionStatusPatch('APPROVED')).toEqual({})
  })
})
