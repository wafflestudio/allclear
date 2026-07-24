import type { RecruitmentRegularMeeting } from '@/repositories/recruitment'
import { normalizeUrl } from '@/shared/utils/clubSns'

export const shouldStackRegularMeetings = (meetingCount: number): boolean => meetingCount >= 2

export const shouldStackActivityLocation = (location: string): boolean =>
	Array.from(location.trim()).length >= 10

const formatTime = (time: string | null): string => time?.slice(0, 5) ?? ''

export const formatRegularMeeting = (meeting: RecruitmentRegularMeeting): string => {
	const day = meeting.day_of_week.endsWith('요일')
		? meeting.day_of_week
		: `${meeting.day_of_week}요일`
	const startTime = formatTime(meeting.start_time)
	const endTime = formatTime(meeting.end_time)
	const time = [startTime, endTime].filter(Boolean).join('–')

	return time ? `${day} ${time}` : day
}

export const getNextExpandedRecruitmentId = (
	currentId: number | null,
	pressedId: number,
): number | null => (currentId === pressedId ? null : pressedId)

export const getRecruitmentApplicationUrl = (applicationUrl: string): string =>
	normalizeUrl(applicationUrl)
