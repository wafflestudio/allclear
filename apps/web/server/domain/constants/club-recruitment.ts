export const CLUB_RECRUITMENT_TERMS = ['1', '2', '여름', '겨울'] as const

export type ClubRecruitmentTerm = (typeof CLUB_RECRUITMENT_TERMS)[number]

export const CLUB_RECRUITMENT_ACTIVITY_LOCATION_TYPES = ['동방', '동방 외', '미정'] as const

export type ClubRecruitmentActivityLocationType =
  (typeof CLUB_RECRUITMENT_ACTIVITY_LOCATION_TYPES)[number]

export const REGULAR_MEETING_DAYS = [
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
  '일요일',
] as const

export type RegularMeetingDay = (typeof REGULAR_MEETING_DAYS)[number]
