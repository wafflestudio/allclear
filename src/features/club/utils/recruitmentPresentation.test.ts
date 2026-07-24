import {
	formatRegularMeeting,
	getRecruitmentApplicationUrl,
	getNextExpandedRecruitmentId,
	shouldStackActivityLocation,
	shouldStackRegularMeetings,
} from './recruitmentPresentation'

describe('recruitment presentation rules', () => {
	it('keeps zero or one regular meeting beside the yes/no row', () => {
		expect(shouldStackRegularMeetings(0)).toBe(false)
		expect(shouldStackRegularMeetings(1)).toBe(false)
	})

	it('stacks two or more regular meetings below the yes/no row', () => {
		expect(shouldStackRegularMeetings(2)).toBe(true)
		expect(shouldStackRegularMeetings(3)).toBe(true)
	})

	it('keeps a nine-character activity location beside its type', () => {
		expect(shouldStackActivityLocation('123456789')).toBe(false)
	})

	it('stacks a ten-character activity location below its type', () => {
		expect(shouldStackActivityLocation('1234567890')).toBe(true)
	})

	it('formats a meeting without exposing empty time separators', () => {
		expect(
			formatRegularMeeting({
				day_of_week: '금',
				start_time: '18:30:00',
				end_time: '20:00:00',
			}),
		).toBe('금요일 18:30–20:00')
		expect(
			formatRegularMeeting({
				day_of_week: '토',
				start_time: null,
				end_time: null,
			}),
		).toBe('토요일')
	})

	it('opens one previous recruitment at a time and toggles it closed', () => {
		expect(getNextExpandedRecruitmentId(null, 10)).toBe(10)
		expect(getNextExpandedRecruitmentId(10, 20)).toBe(20)
		expect(getNextExpandedRecruitmentId(20, 20)).toBeNull()
	})

	it('normalizes an application link before opening it', () => {
		expect(getRecruitmentApplicationUrl('instagram.com/club')).toBe('https://instagram.com/club')
		expect(getRecruitmentApplicationUrl('https://example.com/apply')).toBe(
			'https://example.com/apply',
		)
	})
})
