import {
	clampImageIndex,
	clampImageScale,
	getAdjacentImageIndex,
	getPanTranslation,
} from "./imageViewer";

describe("image viewer navigation", () => {
	it("clamps an initial image index to the available image range", () => {
		expect(clampImageIndex(-1, 3)).toBe(0);
		expect(clampImageIndex(1, 3)).toBe(1);
		expect(clampImageIndex(5, 3)).toBe(2);
		expect(clampImageIndex(0, 0)).toBe(0);
	});

	it("does not navigate beyond the first or last image", () => {
		expect(getAdjacentImageIndex(0, -1, 3)).toBe(0);
		expect(getAdjacentImageIndex(1, -1, 3)).toBe(0);
		expect(getAdjacentImageIndex(1, 1, 3)).toBe(2);
		expect(getAdjacentImageIndex(2, 1, 3)).toBe(2);
	});
});

describe("image viewer zoom", () => {
	it("keeps the image scale within the supported zoom range", () => {
		expect(clampImageScale(0.5)).toBe(1);
		expect(clampImageScale(3)).toBe(3);
		expect(clampImageScale(10)).toBe(6);
	});

	it("moves a zoomed image using the pan gesture translation", () => {
		expect(
			getPanTranslation({
				initialTranslation: { x: 20, y: -10 },
				gestureTranslation: { x: 60, y: 40 },
				scale: 2,
				viewport: { width: 400, height: 600 },
			}),
		).toEqual({ x: 80, y: 30 });
	});

	it("keeps panning inside the current zoom bounds", () => {
		expect(
			getPanTranslation({
				initialTranslation: { x: 100, y: -100 },
				gestureTranslation: { x: 500, y: -500 },
				scale: 2,
				viewport: { width: 400, height: 600 },
			}),
		).toEqual({ x: 200, y: -300 });
	});
});
