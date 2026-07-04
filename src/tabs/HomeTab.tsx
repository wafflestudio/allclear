import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import ClubDetailScreen from '@/features/club/screens/ClubDetailScreen'
import ClubListScreen from '@/features/club/screens/ClubListScreen'
import ClubReviewScreen from '@/features/club/screens/ClubReviewScreen'
import HomeScreen from '@/features/home/screens/HomeScreen'
import WebViewScreen from '@/features/webview/screens/WebviewScreen'

const Stack = createNativeStackNavigator<StackParamList>()

export function HomeTab() {
	return (
		<Stack.Navigator screenOptions={{ headerBackTitleVisible: false, headerShown: false }}>
			<Stack.Screen key={SCREEN_TYPE.HOME} name={SCREEN_TYPE.HOME} component={HomeScreen} />
			<Stack.Screen
				key={SCREEN_TYPE.CLUB_LIST}
				name={SCREEN_TYPE.CLUB_LIST}
				component={ClubListScreen}
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
