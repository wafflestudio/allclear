import { initialFormData } from './types'

describe('club registration form fields', () => {
	it('collects a single SNS URL', () => {
		expect(initialFormData).toHaveProperty('clubSNS', '')
		expect(initialFormData).not.toHaveProperty('clubSNSUrls')
	})

	it('does not collect founded date or active member count', () => {
		expect(initialFormData).not.toHaveProperty('foundedAt')
		expect(initialFormData).not.toHaveProperty('activeMemberCount')
	})

	it('continues to collect optional activity images', () => {
		expect(initialFormData).toHaveProperty('activityImages', [])
	})
})
