import { getClubSnsUrls, getSnsIcon } from './clubSns'

describe('club SNS presentation', () => {
	it('shows up to three SNS URLs from the new response field', () => {
		expect(
			getClubSnsUrls({
				sns: 'https://legacy.example.com',
				snsUrls: [
					'https://instagram.com/club',
					'https://youtube.com/@club',
					'https://facebook.com/club',
					'https://x.com/club',
				],
			}),
		).toEqual([
			'https://instagram.com/club',
			'https://youtube.com/@club',
			'https://facebook.com/club',
		])
	})

	it('falls back to the legacy SNS URL', () => {
		expect(getClubSnsUrls({ sns: 'https://instagram.com/club' })).toEqual([
			'https://instagram.com/club',
		])
	})

	it('maps supported SNS domains to their icons', () => {
		expect(getSnsIcon('https://instagram.com/club')).toBe('instagram')
		expect(getSnsIcon('https://youtube.com/@club')).toBe('youtube')
		expect(getSnsIcon('https://facebook.com/club')).toBe('facebook')
		expect(getSnsIcon('https://x.com/club')).toBe('twitter')
		expect(getSnsIcon('https://example.com')).toBe('link-variant')
	})
})
