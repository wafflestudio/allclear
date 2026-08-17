import { Image, type ImageSourcePropType, StyleSheet } from "react-native";

import type { OfficialVerificationStatus } from "@/entities/club";
import { ms } from "@/shared/utils/scale";

type Props = {
	status?: OfficialVerificationStatus;
	size?: number;
};

export const DEFAULT_VERIFICATION_MARK_SIZE = 20;

const MARK_SOURCE_BY_STATUS: Partial<
	Record<OfficialVerificationStatus, ImageSourcePropType>
> = {
	VERIFIED: require("@/assets/icons/clubInfo/verification-mark.png"),
	PENDING: require("@/assets/icons/clubInfo/verification-pending-mark.png"),
};

const VerificationMark = ({
	status,
	size = DEFAULT_VERIFICATION_MARK_SIZE,
}: Props) => {
	const markSource = status ? MARK_SOURCE_BY_STATUS[status] : undefined;

	if (!markSource) return null;

	const scaledSize = ms(size);

	return (
		<Image
			accessible={false}
			source={markSource}
			style={[styles.mark, { width: scaledSize, height: scaledSize }]}
			resizeMode="contain"
		/>
	);
};

export default VerificationMark;

const styles = StyleSheet.create({
	mark: {
		flexShrink: 0,
	},
});
