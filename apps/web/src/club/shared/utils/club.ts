// 앱 shared/utils/club.ts 와 동일

type ClubAffiliation = {
  affiliationType?: string | null
  collegeMajor?: { college: string | null; major: string | null } | null
}
type ClubSummary = {
  description?: string | null
  shortDescription?: string | null
}

export const getClubAffiliationLabel = (club: ClubAffiliation): string => {
  if (club.affiliationType === '소속동아리') {
    return club.collegeMajor?.major || club.collegeMajor?.college || '기타'
  }

  return club.affiliationType || '기타'
}

export const getClubSummary = (club: ClubSummary): string =>
  club.shortDescription?.trim() || club.description?.trim() || ''

export const getClubSummaryWithAffiliation = (club: ClubAffiliation & ClubSummary): string => {
  const shortDescription = club.shortDescription?.trim()
  if (!shortDescription) {
    return club.description?.trim() || ''
  }

  const affiliation = getClubAffiliationLabel(club)
  if (affiliation === '기타') {
    return shortDescription
  }

  return `${affiliation} 소속 ${shortDescription}`
}
