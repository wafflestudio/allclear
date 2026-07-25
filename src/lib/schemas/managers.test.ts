import { describe, expect, it } from 'vitest'
import {
  ClubManagerRequestResponseSchema,
  ClubRegisterRequestSchema,
  ClubRegistrationManagerPatchSchema,
  ClubRegistrationManagerSchema,
  ManagedClubPatchSchema,
} from './managers'

const validClubData = {
  name: '와플스튜디오',
  type: '교내' as const,
  category: '학술' as const,
  affiliation: '컴퓨터공학부',
  short_description: '웹/앱 개발 동아리',
  recruit_type: '정기' as const,
  min_activity_period: 2,
  has_dongbang: true,
  dongbang_location: '301동',
  sns_urls: ['https://instagram.com/wafflestudio', 'https://youtube.com/@wafflestudio'],
  introduction: '서비스를 만드는 동아리입니다.',
  founded_at: '2012-02-03',
  active_member_count: 24,
  activity_image_urls: ['https://cdn.all-clear.cc/activity-1.jpg'],
}

describe('manager club information schemas', () => {
  it('parses a manager request prefill response', () => {
    expect(
      ClubManagerRequestResponseSchema.parse({
        name: '홍길동',
        phone: '010-1234-5678',
        student_id: '2021-12345',
      }),
    ).toEqual({
      name: '홍길동',
      phone: '010-1234-5678',
      student_id: '2021-12345',
    })
  })

  it('maps registration manager information to the API response shape', () => {
    expect(
      ClubRegistrationManagerSchema.parse({
        name: '홍길동',
        phone: '010-1234-5678',
        student_id: '2021-12345',
      }),
    ).toEqual({
      name: '홍길동',
      phone: '010-1234-5678',
      student_id: '2021-12345',
    })
  })

  it('accepts partial registration manager updates but rejects an empty update', () => {
    expect(
      ClubRegistrationManagerPatchSchema.parse({
        phone: '010-9876-5432',
      }),
    ).toEqual({
      phone: '010-9876-5432',
    })
    expect(() => ClubRegistrationManagerPatchSchema.parse({})).toThrow()
  })

  it('does not collect founded date or active member count during registration', () => {
    const parsed = ClubRegisterRequestSchema.parse({
      club_data: validClubData,
      manager_data: {
        name: '관리자',
        phone: '01012345678',
        student_id: '2020-12345',
      },
    })

    expect(parsed.club_data).not.toHaveProperty('founded_at')
    expect(parsed.club_data).not.toHaveProperty('active_member_count')
    expect(parsed.club_data).not.toHaveProperty('sns')
    expect(parsed.club_data.sns_urls).toEqual(validClubData.sns_urls)
    expect(parsed.club_data.activity_image_urls).toEqual(validClubData.activity_image_urls)
  })

  it('accepts partial club and manager data in a managed club patch', () => {
    const parsed = ManagedClubPatchSchema.parse({
      club_data: {
        founded_at: null,
        active_member_count: 0,
        sns_urls: [
          'https://instagram.com/wafflestudio',
          'https://youtube.com/@wafflestudio',
          'https://facebook.com/wafflestudio',
        ],
        activity_image_urls: [],
      },
      manager_data: {
        phone: '010-9876-5432',
      },
    })

    expect(parsed).toEqual({
      club_data: {
        sns_urls: [
          'https://instagram.com/wafflestudio',
          'https://youtube.com/@wafflestudio',
          'https://facebook.com/wafflestudio',
        ],
        activity_image_urls: [],
      },
      manager_data: {
        phone: '010-9876-5432',
      },
    })
  })

  it('accepts a manager-only patch but rejects an empty final submission', () => {
    expect(
      ManagedClubPatchSchema.parse({
        manager_data: {
          name: '홍길동',
        },
      }),
    ).toEqual({
      manager_data: {
        name: '홍길동',
      },
    })
    expect(() => ManagedClubPatchSchema.parse({})).toThrow()
    expect(() => ManagedClubPatchSchema.parse({ club_data: {} })).toThrow()
  })

  it('rejects more than three SNS URLs', () => {
    expect(() =>
      ManagedClubPatchSchema.parse({
        club_data: {
          sns_urls: Array.from({ length: 4 }, (_, index) => `https://example.com/social-${index}`),
        },
      }),
    ).toThrow()
  })

  it('rejects registration requests that only provide the legacy SNS field', () => {
    expect(() =>
      ClubRegisterRequestSchema.parse({
        club_data: {
          ...validClubData,
          sns_urls: undefined,
          sns: 'https://instagram.com/wafflestudio',
        },
        manager_data: {
          name: '관리자',
          phone: '01012345678',
          student_id: '2020-12345',
        },
      }),
    ).toThrow()
  })

  it('rejects more than five activity image URLs', () => {
    expect(() =>
      ManagedClubPatchSchema.parse({
        club_data: {
          activity_image_urls: Array.from(
            { length: 6 },
            (_, index) => `https://example.com/activity-${index}.jpg`,
          ),
        },
      }),
    ).toThrow()
  })
})
