export const clampImageIndex = (index: number, imageCount: number): number =>
	Math.min(Math.max(index, 0), Math.max(imageCount - 1, 0))

export const getAdjacentImageIndex = (
	currentIndex: number,
	direction: -1 | 1,
	imageCount: number,
): number => clampImageIndex(currentIndex + direction, imageCount)

type Point = {
	x: number
	y: number
}

type Size = {
	width: number
	height: number
}

type PinchTranslationInput = {
	initialScale: number
	nextScale: number
	initialTranslation: Point
	initialFocal: Point
	currentFocal: Point
	viewport: Size
}

export const MIN_IMAGE_SCALE = 1
export const MAX_IMAGE_SCALE = 6

const clamp = (value: number, minimum: number, maximum: number): number => {
	'worklet'
	return Math.min(Math.max(value, minimum), maximum)
}

export const clampImageScale = (scale: number): number => {
	'worklet'
	return clamp(scale, MIN_IMAGE_SCALE, MAX_IMAGE_SCALE)
}

export const getPinchTranslation = ({
	initialScale,
	nextScale,
	initialTranslation,
	initialFocal,
	currentFocal,
	viewport,
}: PinchTranslationInput): Point => {
	'worklet'

	const scaleRatio = nextScale / initialScale
	const focalOffsetX = initialFocal.x - viewport.width / 2
	const focalOffsetY = initialFocal.y - viewport.height / 2
	const focalMovementX = currentFocal.x - initialFocal.x
	const focalMovementY = currentFocal.y - initialFocal.y
	const maxTranslationX = (viewport.width * (nextScale - 1)) / 2
	const maxTranslationY = (viewport.height * (nextScale - 1)) / 2

	return {
		x: clamp(
			initialTranslation.x * scaleRatio + focalMovementX + focalOffsetX * (1 - scaleRatio),
			-maxTranslationX,
			maxTranslationX,
		),
		y: clamp(
			initialTranslation.y * scaleRatio + focalMovementY + focalOffsetY * (1 - scaleRatio),
			-maxTranslationY,
			maxTranslationY,
		),
	}
}
