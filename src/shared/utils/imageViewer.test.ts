import {
	clampImageIndex,
	clampImageScale,
	getAdjacentImageIndex,
	getPinchTranslation,
} from './imageViewer'

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

describe('image viewer zoom', () => {
	it('keeps the image scale within the supported zoom range', () => {
		expect(clampImageScale(0.5)).toBe(1)
		expect(clampImageScale(3)).toBe(3)
		expect(clampImageScale(10)).toBe(6)
	})

	it('moves the zoomed image with a two-finger pinch focal point', () => {
		expect(
			getPinchTranslation({
				initialScale: 1,
				nextScale: 2,
				initialTranslation: { x: 0, y: 0 },
				initialFocal: { x: 250, y: 300 },
				currentFocal: { x: 270, y: 320 },
				viewport: { width: 400, height: 600 },
			}),
		).toEqual({ x: -30, y: 20 })
	})

	it('keeps the moved image inside the zoomed viewport bounds', () => {
		expect(
			getPinchTranslation({
				initialScale: 2,
				nextScale: 2,
				initialTranslation: { x: 0, y: 0 },
				initialFocal: { x: 200, y: 300 },
				currentFocal: { x: 1000, y: -1000 },
				viewport: { width: 400, height: 600 },
			}),
		).toEqual({ x: 200, y: -300 })
	})

	it('keeps a previously panned point under the fingers while zooming again', () => {
		expect(
			getPinchTranslation({
				initialScale: 2,
				nextScale: 4,
				initialTranslation: { x: 100, y: -50 },
				initialFocal: { x: 200, y: 300 },
				currentFocal: { x: 200, y: 300 },
				viewport: { width: 400, height: 600 },
			}),
		).toEqual({ x: 200, y: -100 })
	})
})
