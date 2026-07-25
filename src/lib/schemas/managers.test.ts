import { describe, expect, it } from 'vitest'
import {
  ClubManagerRequestResponseSchema,
  ClubRegisterRequestSchema,
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

  it('accepts up to three SNS URLs and does not collect removed fields in manager patches', () => {
    const parsed = ManagedClubPatchSchema.parse({
      founded_at: null,
      active_member_count: 0,
      sns_urls: [
        'https://instagram.com/wafflestudio',
        'https://youtube.com/@wafflestudio',
        'https://facebook.com/wafflestudio',
      ],
      activity_image_urls: [],
    })

    expect(parsed).toEqual({
      sns_urls: [
        'https://instagram.com/wafflestudio',
        'https://youtube.com/@wafflestudio',
        'https://facebook.com/wafflestudio',
      ],
      activity_image_urls: [],
    })
  })

  it('rejects more than three SNS URLs', () => {
    expect(() =>
      ManagedClubPatchSchema.parse({
        sns_urls: Array.from({ length: 4 }, (_, index) => `https://example.com/social-${index}`),
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
        activity_image_urls: Array.from(
          { length: 6 },
          (_, index) => `https://example.com/activity-${index}.jpg`,
        ),
      }),
    ).toThrow()
  })
})
