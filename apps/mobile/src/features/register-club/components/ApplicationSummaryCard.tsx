import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { RegisterClubFormData } from "@/features/register-club/types";
import type { RegisterClubFocusTarget } from "@/features/register-club/types/focus";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import type { EditableImage } from "@/shared/types/image";
import { s, vs } from "@/shared/utils/scale";

const editPencilIcon = require("@/assets/icons/club-edit-pencil.png") as number;

type Props = {
	formData: RegisterClubFormData;
	evidenceImages: EditableImage[];
	onEdit: (target: RegisterClubFocusTarget) => void;
};

type SummaryRowProps = {
	label: string;
	value: string;
	target: RegisterClubFocusTarget;
	onEdit: (target: RegisterClubFocusTarget) => void;
};

type SummaryRowData = Omit<SummaryRowProps, "onEdit">;

const SummaryRow = ({ label, value, target, onEdit }: SummaryRowProps) => (
	<View style={styles.row}>
		<Text style={styles.label}>{label}</Text>
		<Text style={styles.value}>{value}</Text>
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${label} 수정`}
			hitSlop={10}
			onPress={() => onEdit(target)}
			style={styles.editButton}
		>
			<Image
				accessible={false}
				source={editPencilIcon}
				resizeMode="contain"
				style={styles.editIcon}
			/>
		</Pressable>
	</View>
);

export const ApplicationSummaryCard = ({
	formData,
	evidenceImages,
	onEdit,
}: Props) => {
	const snsCount = formData.clubSNSUrls.filter((url) => url.trim()).length;
	const activityPeriod = formData.minActivityPeriodInput.trim()
		? `${formData.minActivityPeriodInput}학기`
		: "없음";

	const rows: SummaryRowData[] = [
		{
			label: "동아리명",
			value: formData.clubName || "없음",
			target: "clubName",
		},
		{
			label: "동아리 소속",
			value: formData.department || "없음",
			target: "department",
		},
		{
			label: "모집 형태",
			value: formData.recruitType || "없음",
			target: "recruitType",
		},
		{
			label: "(최소) 활동 기간",
			value: activityPeriod,
			target: "minActivityPeriod",
		},
		{
			label: "동방 보유 여부",
			value: formData.hasDongbang ? "보유" : "미보유",
			target: "hasDongbang",
		},
		{
			label: "동아리 SNS",
			value: `등록한 링크 ${snsCount}개`,
			target: "clubSNSUrls",
		},
		{
			label: "동아리 추가 설명",
			value: formData.clubDescription || "없음",
			target: "clubDescription",
		},
		{
			label: "증빙 자료",
			value: `${evidenceImages.length}장 첨부`,
			target: "evidenceImages",
		},
	];

	return (
		<View style={styles.card}>
			<View style={styles.divider} />
			{rows.map((row) => (
				<View key={row.label}>
					<SummaryRow {...row} onEdit={onEdit} />
					<View style={styles.divider} />
				</View>
			))}
			<View style={styles.attachmentNames}>
				{evidenceImages.map((image, index) => (
					<Text key={image.id} style={styles.attachmentName}>
						{image.file?.name ?? `증빙자료 ${index + 1}`}
					</Text>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: Colors.WHITE,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: s(12),
		borderWidth: 1,
		padding: s(20),
	},
	divider: {
		height: 1,
		backgroundColor: Colors.BODYTEXT_DISABLED,
		opacity: 0.3,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: s(12),
		paddingVertical: vs(12),
	},
	label: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		width: s(102),
	},
	value: {
		...typography.bodyMSemibold,
		color: Colors.BLACK,
		flex: 1,
	},
	editIcon: {
		width: s(10),
		height: s(10),
		tintColor: Colors.BODYTEXT_DISABLED,
	},
	editButton: {
		padding: s(6),
		margin: s(-6),
	},
	attachmentNames: {
		paddingLeft: s(7),
		paddingTop: vs(5),
	},
	attachmentName: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
	},
});
