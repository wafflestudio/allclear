import { Pressable, StyleSheet } from "react-native";

import type { OfficialVerificationStatus } from "@/entities/club";
import VerificationMark, {
	DEFAULT_VERIFICATION_MARK_SIZE,
} from "@/features/club/components/VerificationMark";
import { ms } from "@/shared/utils/scale";

type Props = {
	status?: OfficialVerificationStatus;
	onPress: () => void;
};

const VerificationMarkButton = ({ status, onPress }: Props) => {
	if (status !== "VERIFIED" && status !== "PENDING") return null;

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="동아리 인증 상태 안내"
			onPress={onPress}
			hitSlop={8}
			style={({ pressed }) => [styles.button, pressed && styles.pressed]}
		>
			<VerificationMark status={status} />
		</Pressable>
	);
};

export default VerificationMarkButton;

const styles = StyleSheet.create({
	button: {
		width: ms(DEFAULT_VERIFICATION_MARK_SIZE),
		height: ms(DEFAULT_VERIFICATION_MARK_SIZE),
		justifyContent: "center",
		alignItems: "center",
		flexShrink: 0,
	},
	pressed: {
		opacity: 0.5,
	},
});
