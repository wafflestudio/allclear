import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
	focusManager,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
	initialWindowMetrics,
	SafeAreaProvider,
} from "react-native-safe-area-context";
import Toast, { type ToastConfig } from "react-native-toast-message";
import { linking } from "@/config/linking";
import AnnouncementEditScreen from "@/features/club/screens/AnnouncementEditScreen";
import AnnouncementRegistrationScreen from "@/features/club/screens/AnnouncementRegistrationScreen";
import ManagerTransferAcceptanceScreen from "@/features/club/screens/ManagerTransferAcceptanceScreen";
import { getAnnouncementRepository } from "@/repositories/announcement";
import { getAppVersionRepository } from "@/repositories/appVersion";
import { getAuthRepository } from "@/repositories/auth";
import { getCategoryRepository } from "@/repositories/category";
import { getClubRepository } from "@/repositories/club";
import { getRecentSearchRepository } from "@/repositories/recentSearch";
import { getRecruitmentRepository } from "@/repositories/recruitment";
import { getReviewRepository } from "@/repositories/review";
import { getTermRepository } from "@/repositories/term";
import { getUserRepository } from "@/repositories/user";
import AppModalManager from "@/shared/components/AppModalManager";
import ForceUpdateGate from "@/shared/components/ForceUpdateGate";
import { Colors } from "@/shared/constants/colors";
import {
	type RootStackParamList,
	SCREEN_TYPE,
} from "@/shared/constants/screen";
import { typography } from "@/shared/constants/typography";
import { LoginBottomSheetProvider } from "@/shared/contexts/loginBottomSheetContext";
import { ManageClubBottomSheetProvider } from "@/shared/contexts/manageClubBottomSheet";
import { ProfileProvider } from "@/shared/contexts/profileContext";
import { serviceContext } from "@/shared/contexts/serviceContext";
import { UserVoiceBottomSheetProvider } from "@/shared/contexts/userVoiceBottomSheetContext";
import { initToken } from "@/shared/utils/api";
import { shouldShowGlobalAppModals } from "@/shared/utils/entrySplash";
import {
	_navigationRef,
	setIsNavigationReady,
} from "@/shared/utils/navigation";
import { ms, s, vs } from "@/shared/utils/scale";
import { TabNavigator } from "@/tabs/TabNavigator";
import { getAnnouncementService } from "@/usecases/announcement";
import { getAppVersionService } from "@/usecases/appVersion";
import { getAuthService } from "@/usecases/auth";
import { getCategoryService } from "@/usecases/category";
import { getClubService } from "@/usecases/club";
import { getEventLogService } from "@/usecases/eventLog";
import { getRecentSearchService } from "@/usecases/recentSearch";
import { getRecruitmentService } from "@/usecases/recruitment";
import { getReviewService } from "@/usecases/review";
import { getTermService } from "@/usecases/term";
import { getUserService } from "@/usecases/user";

const RootStack = createNativeStackNavigator<RootStackParamList>();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			cacheTime: 10 * 60 * 1000,
		},
	},
});

function App(): React.JSX.Element {
	const { Provider: ServiceProvider } = serviceContext;

	const announcementRepository = getAnnouncementRepository();
	const appVersionRepository = getAppVersionRepository();
	const authRepository = getAuthRepository();
	const categoryRepository = getCategoryRepository();
	const clubRepository = getClubRepository();
	const recentSearchRepository = getRecentSearchRepository();
	const recruitmentRepository = getRecruitmentRepository();
	const reviewRepository = getReviewRepository();
	const termRepository = getTermRepository();
	const userRepository = getUserRepository();

	const announcementService = getAnnouncementService({
		repositories: [announcementRepository],
	});
	const appVersionService = getAppVersionService({
		repositories: [appVersionRepository],
	});
	const authService = getAuthService({ repositories: [authRepository] });
	const categoryService = getCategoryService({
		repositories: [categoryRepository],
	});
	const clubService = getClubService({ repositories: [clubRepository] });
	const eventLogService = getEventLogService();
	const recentSearchService = getRecentSearchService({
		repositories: [recentSearchRepository],
	});
	const recruitmentService = getRecruitmentService({
		repositories: [recruitmentRepository],
	});
	const reviewService = getReviewService({ repositories: [reviewRepository] });
	const termService = getTermService({ repositories: [termRepository] });
	const userService = getUserService({ repositories: [userRepository] });

	const services = {
		announcementService,
		appVersionService,
		authService,
		categoryService,
		clubService,
		eventLogService,
		recentSearchService,
		recruitmentService,
		reviewService,
		termService,
		userService,
	};

	// 토큰을 메모리로 복원한 뒤에야 인증 요청을 하는 트리(ProfileProvider 등)를 마운트한다.
	// 그렇지 않으면 _token이 채워지기 전에 /v2/users/me가 게스트로 나가 자동로그인이 깨진다.
	const [isBootstrapped, setIsBootstrapped] = useState(false);
	const [entryFlowComplete, setEntryFlowComplete] = useState(false);
	const handleEntryComplete = useCallback(() => setEntryFlowComplete(true), []);

	useEffect(() => {
		const bootstrap = async () => {
			await initToken();
			setIsNavigationReady(true);
			setIsBootstrapped(true);
		};
		bootstrap();
	}, []);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextAppState) => {
			focusManager.setFocused(nextAppState === "active");
		});

		return () => subscription.remove();
	}, []);

	// 부트스트랩 동안에는 네이티브 스플래시가 화면을 덮고 있어 사용자에겐 빈 화면이 보이지 않는다.
	if (!isBootstrapped) {
		return <View style={styles.bootstrapPlaceholder} />;
	}

	return (
		<ServiceProvider value={services}>
			<QueryClientProvider client={queryClient}>
				<ProfileProvider>
					<SafeAreaProvider initialMetrics={initialWindowMetrics}>
						<GestureHandlerRootView style={{ flex: 1 }}>
							<BottomSheetModalProvider>
								<LoginBottomSheetProvider>
									<UserVoiceBottomSheetProvider>
										<ManageClubBottomSheetProvider>
											<ForceUpdateGate onEntryComplete={handleEntryComplete}>
												<NavigationContainer
													ref={_navigationRef}
													linking={linking}
												>
													<RootStack.Navigator
														screenOptions={{ headerShown: false }}
													>
														<RootStack.Screen
															name="Main"
															component={TabNavigator}
														/>
														<RootStack.Screen
															name={SCREEN_TYPE.ANNOUNCEMENT_REGISTRATION}
															component={AnnouncementRegistrationScreen}
														/>
														<RootStack.Screen
															name={SCREEN_TYPE.ANNOUNCEMENT_EDIT}
															component={AnnouncementEditScreen}
														/>
														<RootStack.Screen
															name={SCREEN_TYPE.MANAGER_TRANSFER_ACCEPTANCE}
															component={ManagerTransferAcceptanceScreen}
														/>
													</RootStack.Navigator>
												</NavigationContainer>
												{shouldShowGlobalAppModals({ entryFlowComplete }) && (
													<AppModalManager />
												)}
											</ForceUpdateGate>
										</ManageClubBottomSheetProvider>
									</UserVoiceBottomSheetProvider>
								</LoginBottomSheetProvider>
							</BottomSheetModalProvider>
						</GestureHandlerRootView>
					</SafeAreaProvider>
				</ProfileProvider>
			</QueryClientProvider>
			<Toast config={toastConfig} visibilityTime={2000} position="bottom" />
		</ServiceProvider>
	);
}

export default App;

const styles = StyleSheet.create({
	bootstrapPlaceholder: {
		flex: 1,
		backgroundColor: Colors.WHITE,
	},
});

const toastConfig: ToastConfig = {
	info: ({ text1 }) => (
		<View style={toastStyles.container}>
			<Text style={toastStyles.text} numberOfLines={1}>
				{text1}
			</Text>
		</View>
	),
};

const toastStyles = StyleSheet.create({
	container: {
		backgroundColor: Colors.BODYTEXT_MAIN,
		borderRadius: ms(100),
		paddingHorizontal: s(24),
		paddingVertical: vs(14),
		marginHorizontal: s(16),
		shadowColor: Colors.BLACK,
		shadowOffset: { width: 0, height: vs(4) },
		shadowOpacity: 0.12,
		shadowRadius: ms(12),
		elevation: 8,
	},
	text: {
		...typography.bodyMSemibold,
		color: Colors.WHITE,
		textAlign: "center",
	},
});
