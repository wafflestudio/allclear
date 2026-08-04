export const clampImageIndex = (index: number, imageCount: number): number =>
	Math.min(Math.max(index, 0), Math.max(imageCount - 1, 0));

export const getAdjacentImageIndex = (
	currentIndex: number,
	direction: -1 | 1,
	imageCount: number,
): number => clampImageIndex(currentIndex + direction, imageCount);

type Point = {
	x: number;
	y: number;
};

type Size = {
	width: number;
	height: number;
};

type PanTranslationInput = {
	initialTranslation: Point;
	gestureTranslation: Point;
	scale: number;
	viewport: Size;
};

export const MIN_IMAGE_SCALE = 1;
export const MAX_IMAGE_SCALE = 6;

const clamp = (value: number, minimum: number, maximum: number): number => {
	"worklet";
	return Math.min(Math.max(value, minimum), maximum);
};

export const clampImageScale = (scale: number): number => {
	"worklet";
	return clamp(scale, MIN_IMAGE_SCALE, MAX_IMAGE_SCALE);
};

export const getPanTranslation = ({
	initialTranslation,
	gestureTranslation,
	scale,
	viewport,
}: PanTranslationInput): Point => {
	"worklet";

	const maxTranslationX = (viewport.width * (scale - 1)) / 2;
	const maxTranslationY = (viewport.height * (scale - 1)) / 2;

	return {
		x: clamp(
			initialTranslation.x + gestureTranslation.x,
			-maxTranslationX,
			maxTranslationX,
		),
		y: clamp(
			initialTranslation.y + gestureTranslation.y,
			-maxTranslationY,
			maxTranslationY,
		),
	};
};
