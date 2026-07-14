import { Club } from '@/entities/club'

type ClubAffiliation = Pick<Club, 'affiliationType' | 'collegeMajor'>

export const getClubAffiliationLabel = (club: ClubAffiliation): string => {
	if (club.affiliationType === '소속동아리') {
		return club.collegeMajor?.major || club.collegeMajor?.college || '기타'
	}

	return club.affiliationType || '기타'
}
