import { describe, expect, it } from 'vitest'
import { AdminClubDetailResponseSchema } from './admin'

describe('admin club detail schema', () => {
  it('includes activity images submitted with the registration request', () => {
    const parsed = AdminClubDetailResponseSchema.parse({
      success: true,
      data: {
        club_data: {
          uuid: 'c0a80121-7ac0-4a29-8f9a-47acda471daf',
          status: 'PENDING',
          name: '와플스튜디오',
          type: '교내',
          category: '학술',
          affiliation: '컴퓨터공학부',
          college_major_id: null,
          short_description: '웹/앱 개발 동아리',
          image_uri: 'https://cdn.all-clear.cc/club.jpg',
          recruit_type: '정기',
          min_activity_period: 2,
          has_dongbang: true,
          dongbang_location: '301동',
          sns_urls: ['https://instagram.com/wafflestudio', 'https://youtube.com/@wafflestudio'],
          introduction: '서비스를 만드는 동아리입니다.',
          activity_image_urls: ['https://cdn.all-clear.cc/activity-1.jpg'],
          created_at: '2026-07-23T00:00:00.000Z',
          reject_reason: null,
        },
        manager_data: {
          name: '관리자',
          phone: '01012345678',
          student_id: '2020-12345',
          service_user_id: 'service-user-id',
        },
      },
    })

    expect(parsed.data.club_data.activity_image_urls).toEqual([
      'https://cdn.all-clear.cc/activity-1.jpg',
    ])
    expect(parsed.data.club_data).not.toHaveProperty('sns')
    expect(parsed.data.club_data.sns_urls).toEqual([
      'https://instagram.com/wafflestudio',
      'https://youtube.com/@wafflestudio',
    ])
  })
})
