import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import SavedClubListScreen from '@/features/club/screens/SavedClubListScreen'
import ClubReviewScreen from '@/features/club/screens/ClubReviewScreen'
import ClubDetailScreen from '@/features/club/screens/ClubDetailScreen'
import WebViewScreen from '@/features/webview/screens/WebviewScreen'

const Stack = createNativeStackNavigator<StackParamList>()

export function SavedTab() {
	return (
		<Stack.Navigator screenOptions={{ headerBackTitleVisible: false, headerShown: false }}>
			<Stack.Screen
				key={SCREEN_TYPE.SAVED_CLUB_LIST}
				name={SCREEN_TYPE.SAVED_CLUB_LIST}
				component={SavedClubListScreen}
			/>
			<Stack.Screen
				key={SCREEN_TYPE.CLUB_DETAIL}
				name={SCREEN_TYPE.CLUB_DETAIL}
				component={ClubDetailScreen}
			/>
			<Stack.Screen
				key={SCREEN_TYPE.CLUB_REVIEW}
				name={SCREEN_TYPE.CLUB_REVIEW}
				component={ClubReviewScreen}
			/>
			<Stack.Screen
				key={SCREEN_TYPE.WEBVIEW}
				name={SCREEN_TYPE.WEBVIEW}
				component={WebViewScreen}
			/>
		</Stack.Navigator>
	)
}
