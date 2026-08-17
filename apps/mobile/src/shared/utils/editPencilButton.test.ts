import { getEditPencilButtonColors } from "./editPencilButton";

describe("edit pencil button colors", () => {
	it("uses the default Figma colors when idle", () => {
		expect(
			getEditPencilButtonColors({ hovered: false, pressed: false }),
		).toEqual({
			backgroundColor: "#EAEAEA",
			iconColor: "#874FFF",
		});
	});

	it("uses the selected colors when hovered", () => {
		expect(
			getEditPencilButtonColors({ hovered: true, pressed: false }),
		).toEqual({
			backgroundColor: "#874FFF",
			iconColor: "#FFFFFF",
		});
	});

	it("uses the push colors while pressed even when hovered", () => {
		expect(getEditPencilButtonColors({ hovered: true, pressed: true })).toEqual(
			{
				backgroundColor: "#4F2E94",
				iconColor: "#FFFFFF",
			},
		);
	});
});
