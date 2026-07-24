import { clampImageIndex, getAdjacentImageIndex } from './imageViewer'

describe('image viewer navigation', () => {
	it('clamps an initial image index to the available image range', () => {
		expect(clampImageIndex(-1, 3)).toBe(0)
		expect(clampImageIndex(1, 3)).toBe(1)
		expect(clampImageIndex(5, 3)).toBe(2)
		expect(clampImageIndex(0, 0)).toBe(0)
	})

	it('does not navigate beyond the first or last image', () => {
		expect(getAdjacentImageIndex(0, -1, 3)).toBe(0)
		expect(getAdjacentImageIndex(1, -1, 3)).toBe(0)
		expect(getAdjacentImageIndex(1, 1, 3)).toBe(2)
		expect(getAdjacentImageIndex(2, 1, 3)).toBe(2)
	})
})
