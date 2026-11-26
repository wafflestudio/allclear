import { Image, Platform, StyleSheet, Text, View } from "react-native";
import type { OfficialVerificationStatus } from "@/entities/club";
import VerificationMark from "@/features/club/components/VerificationMark";
import EditPencilButton from "@/shared/components/EditPencilButton";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { ms, s, vs } from "@/shared/utils/scale";

const clubManagementSnuLogo =
	require("@/assets/images/club-management-snu-logo.png") as number;

type Props = {
	clubName: string;
	clubImageUri?: string | null;
	department: string;
	shortIntro: string;
	officialVerificationStatus?: OfficialVerificationStatus;
	onEdit?: () => void;
};

export const ClubProfileCard = ({
	clubName,
	clubImageUri,
	department,
	shortIntro,
	officialVerificationStatus,
	onEdit,
}: Props) => (
	<View style={styles.card}>
		{clubImageUri ? (
			<Image
				source={{ uri: clubImageUri }}
				style={styles.backgroundImage}
				blurRadius={Platform.OS === "ios" ? 2 : 1}
			/>
		) : (
			<View style={[styles.backgroundImage, styles.placeholderBackground]} />
		)}
		<View style={styles.backgroundTint} />
		<View style={styles.content}>
			<View style={styles.clubDetails}>
				<Image source={clubManagementSnuLogo} style={styles.clubLogo} />
				<View style={styles.clubTexts}>
					<View style={styles.clubNameRow}>
						<Text style={styles.clubName} numberOfLines={1}>
							{clubName}
						</Text>
						<VerificationMark status={officialVerificationStatus} size={16} />
					</View>
					{department ? (
						<Text style={styles.clubDescription} numberOfLines={1}>
							{department} 소속
						</Text>
					) : null}
					{shortIntro ? (
						<Text style={styles.clubDescription} numberOfLines={1}>
							{shortIntro}
						</Text>
					) : null}
				</View>
			</View>
			{onEdit ? (
				<EditPencilButton
					accessibilityLabel="동아리 정보 수정"
					onPress={onEdit}
				/>
			) : null}
		</View>
	</View>
);

const styles = StyleSheet.create({
	card: {
		borderRadius: ms(12),
		height: vs(186),
		overflow: "hidden",
	},
	backgroundImage: {
		position: "absolute",
		width: "100%",
		height: "100%",
		resizeMode: "cover",
	},
	placeholderBackground: {
		backgroundColor: "#E8E4F0",
	},
	backgroundTint: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(255,255,255,0.6)",
	},
	content: {
		flex: 1,
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		paddingHorizontal: s(20),
		paddingVertical: vs(30),
	},
	clubDetails: {
		flex: 1,
		marginRight: s(16),
		gap: vs(12),
		alignItems: "flex-start",
	},
	clubLogo: {
		width: ms(40),
		height: ms(40),
		borderRadius: ms(20),
		resizeMode: "contain",
	},
	clubTexts: {
		alignSelf: "stretch",
		gap: vs(8),
	},
	clubNameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: s(4),
	},
	clubName: {
		...typography.headerXL,
		lineHeight: ms(24),
		letterSpacing: -0.02 * 20,
		color: Colors.BLACK,
		flexShrink: 1,
	},
	clubDescription: {
		...typography.bodyMMedium,
		lineHeight: ms(17),
		letterSpacing: -0.02 * 14,
		color: Colors.BODYTEXT_SUB,
	},
});
