export const CLUB_RECRUIT_TYPES = ['정기', '상시', '미정'] as const

export type ClubRecruitType = (typeof CLUB_RECRUIT_TYPES)[number]

export function normalizeClubRecruitType(recruitType: string | null | undefined): ClubRecruitType {
  if (recruitType === '정기' || recruitType === '매 학기' || recruitType === '매 년') {
    return '정기'
  }

  if (recruitType === '상시') {
    return '상시'
  }

  return '미정'
}
