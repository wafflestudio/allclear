export const clampImageIndex = (index: number, imageCount: number): number =>
	Math.min(Math.max(index, 0), Math.max(imageCount - 1, 0))

export const getAdjacentImageIndex = (
	currentIndex: number,
	direction: -1 | 1,
	imageCount: number,
): number => clampImageIndex(currentIndex + direction, imageCount)
