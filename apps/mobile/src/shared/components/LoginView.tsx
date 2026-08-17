import { useCallback } from "react";
import {
	ActivityIndicator,
	Image,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { Colors } from "@/shared/constants/colors";
import { SCREEN_TYPE } from "@/shared/constants/screen";
import { typography } from "@/shared/constants/typography";
import useLoginActions from "@/shared/hooks/useLoginActions";
import { navigation } from "@/shared/utils/navigation";
import { ms, s, vs } from "@/shared/utils/scale";

type Props = {
	closeBottomSheet: () => void;
	onSuccess?: () => void;
};

const LoginView = ({ closeBottomSheet, onSuccess }: Props) => {
	const handleLoginSuccess = useCallback(() => {
		closeBottomSheet();
		onSuccess?.();
	}, [closeBottomSheet, onSuccess]);
	const { isLoading, onAppleButtonPress, onKakaoButtonPress } =
		useLoginActions(handleLoginSuccess);

	return (
		<View style={styles.mainWrapper}>
			<View style={styles.titleWrapper}>
				<View style={styles.flexRow}>
					<Text style={styles.titleBold}>로그인</Text>
					<Text style={styles.titleRegular}>이 필요해요</Text>
				</View>
			</View>
			<View>
				<Pressable
					style={[
						styles.button,
						styles.kakao,
						isLoading && styles.buttonDisabled,
					]}
					onPress={onKakaoButtonPress}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator color={Colors.BLACK} />
					) : (
						<>
							<Image
								source={require("@/assets/icons/kakao.png")}
								style={styles.icon}
							/>
							<Text style={styles.kakaoText}>카카오톡으로 계속하기</Text>
						</>
					)}
				</Pressable>
				{Platform.OS === "ios" && (
					<Pressable
						style={[
							styles.button,
							styles.apple,
							isLoading && styles.buttonDisabled,
						]}
						onPress={onAppleButtonPress}
						disabled={isLoading}
					>
						{isLoading ? (
							<ActivityIndicator color={Colors.WHITE} />
						) : (
							<>
								<Image
									source={require("@/assets/icons/apple.png")}
									style={styles.icon}
								/>
								<Text style={styles.appleText}>Apple로 계속하기</Text>
							</>
						)}
					</Pressable>
				)}
			</View>
			<View style={styles.termsRow}>
				<Pressable
					onPress={() => {
						closeBottomSheet();
						navigation.navigate(SCREEN_TYPE.WEBVIEW, {
							uri: "https://www.all-clear.cc/terms/terms-of-service",
							title: "서비스 이용약관",
						});
					}}
					style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
				>
					<Text style={styles.termsLink}>서비스 이용약관</Text>
				</Pressable>
				<Text style={styles.termsDivider}>|</Text>
				<Pressable
					onPress={() => {
						closeBottomSheet();
						navigation.navigate(SCREEN_TYPE.WEBVIEW, {
							uri: "https://www.all-clear.cc/terms/privacy-policy",
							title: "개인정보 처리방침",
						});
					}}
					style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
				>
					<Text style={styles.termsLink}>개인정보 처리방침</Text>
				</Pressable>
			</View>
		</View>
	);
};

export default LoginView;

const styles = StyleSheet.create({
	flexRow: {
		flexDirection: "row",
	},
	mainWrapper: {
		flex: 1,
		paddingVertical: vs(32),
		paddingHorizontal: s(24),
		backgroundColor: Colors.WHITE,
	},
	titleWrapper: {
		justifyContent: "center",
		alignItems: "center",
		marginBottom: vs(24),
	},
	titleBold: {
		...typography.headerL,
	},
	titleRegular: {
		...typography.headerL,
		fontFamily: "Pretendard-Regular",
	},
	button: {
		padding: ms(16),
		borderRadius: ms(12),
		position: "relative",
		marginBottom: vs(12),
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	icon: {
		width: s(24),
		height: vs(24),
		position: "absolute",
		top: vs(13),
		left: s(16),
	},
	apple: {
		backgroundColor: Colors.BLACK,
	},
	appleText: {
		...typography.bodyMMedium,
		color: Colors.TEXT_BUTTON_SELECTED,
		textAlign: "center",
	},
	kakao: {
		backgroundColor: Colors.KAKAO,
	},
	kakaoText: {
		...typography.bodyMMedium,
		color: Colors.BLACK,
		textAlign: "center",
	},
	termsRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: s(8),
		marginTop: vs(10),
	},
	termsDivider: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_DISABLED,
	},
	termsLink: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_DISABLED,
	},
});
