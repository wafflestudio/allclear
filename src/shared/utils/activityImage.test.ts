import {
	MAX_ACTIVITY_IMAGE_FILE_SIZE_BYTES,
	isActivityImageFileSizeAllowed,
} from '@/shared/utils/activityImage'

describe('activity image validation', () => {
	it('accepts an activity image whose size is exactly 10MB', () => {
		expect(isActivityImageFileSizeAllowed(MAX_ACTIVITY_IMAGE_FILE_SIZE_BYTES)).toBe(true)
	})

	it('rejects an activity image whose size exceeds 10MB', () => {
		expect(isActivityImageFileSizeAllowed(MAX_ACTIVITY_IMAGE_FILE_SIZE_BYTES + 1)).toBe(false)
	})

	it('allows an activity image when the picker does not provide its file size', () => {
		expect(isActivityImageFileSizeAllowed(undefined)).toBe(true)
	})
})
