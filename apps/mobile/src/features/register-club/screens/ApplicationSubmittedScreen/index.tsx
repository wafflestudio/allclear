import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClubProfileCard } from "@/features/club/components/ClubProfileCard";
import { ApplicationReceivedCard } from "@/features/register-club/components/ApplicationReceivedCard";
import { FormNavigationButtons } from "@/features/register-club/components/FormNavigationButtons";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { s, vs } from "@/shared/utils/scale";

type Props = {
	clubName: string;
	clubImageUri: string | null;
	department: string;
	shortIntro: string;
	onComplete: () => void;
};

export const ApplicationSubmittedScreen = ({
	clubName,
	clubImageUri,
	department,
	shortIntro,
	onComplete,
}: Props) => (
	<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<Text style={styles.title}>
				<Text style={styles.clubName}>{clubName}</Text>의{"\n"}
				신청이 접수되었어요!
			</Text>
			<Text style={styles.subtitle}>
				검토 후 결과를 안내해드릴게요.{"\n"}
				신청 상태는 마이에서 언제든 확인할 수 있어요.
			</Text>
			<View style={styles.cards}>
				<ApplicationReceivedCard />
				<ClubProfileCard
					clubName={clubName}
					clubImageUri={clubImageUri}
					department={department}
					shortIntro={shortIntro}
				/>
			</View>
		</ScrollView>
		<FormNavigationButtons
			onNext={onComplete}
			isLastStep
			showProgress={false}
		/>
	</SafeAreaView>
);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.WHITE,
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingHorizontal: s(20),
		paddingTop: vs(20),
		paddingBottom: vs(24),
	},
	title: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
	},
	subtitle: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		marginTop: vs(8),
	},
	cards: {
		marginTop: vs(16),
		gap: vs(16),
	},
	clubName: {
		color: Colors.POINTCOLOR,
	},
});
