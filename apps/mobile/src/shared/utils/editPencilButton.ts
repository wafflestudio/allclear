import { Colors } from "@/shared/constants/colors";

type EditPencilButtonState = {
	hovered: boolean;
	pressed: boolean;
};

type EditPencilButtonColors = {
	backgroundColor: string;
	iconColor: string;
};

export const getEditPencilButtonColors = ({
	hovered,
	pressed,
}: EditPencilButtonState): EditPencilButtonColors => {
	if (pressed) {
		return {
			backgroundColor: Colors.BUTTON_PUSH,
			iconColor: Colors.TEXT_BUTTON_SELECTED,
		};
	}

	if (hovered) {
		return {
			backgroundColor: Colors.BUTTON_SELECTED,
			iconColor: Colors.TEXT_BUTTON_SELECTED,
		};
	}

	return {
		backgroundColor: Colors.TEXTBOX_SELECTED,
		iconColor: Colors.BUTTON_SELECTED,
	};
};
