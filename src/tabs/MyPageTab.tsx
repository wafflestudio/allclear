import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import EditProfileScreen from '@/features/mypage/screens/EditProfileScreen'
import ManageClubRegistrationScreen from '@/features/mypage/screens/ManageClubRegistrationScreen'
import MyPageScreen from '@/features/mypage/screens/MyPageScreen'
import WebViewScreen from '@/features/webview/screens/WebviewScreen'

const Stack = createNativeStackNavigator<StackParamList>()

export function MyPageTab() {
	return (
		<Stack.Navigator screenOptions={{ headerBackTitleVisible: false, headerShown: false }}>
			<Stack.Screen key={SCREEN_TYPE.MYPAGE} name={SCREEN_TYPE.MYPAGE} component={MyPageScreen} />
			<Stack.Screen
				key={SCREEN_TYPE.EDIT_PROFILE}
				name={SCREEN_TYPE.EDIT_PROFILE}
				component={EditProfileScreen}
			/>
			<Stack.Screen
				key={SCREEN_TYPE.MANAGE_CLUB_REGISTRATION}
				name={SCREEN_TYPE.MANAGE_CLUB_REGISTRATION}
				component={ManageClubRegistrationScreen}
			/>
			<Stack.Screen
				key={SCREEN_TYPE.WEBVIEW}
				name={SCREEN_TYPE.WEBVIEW}
				component={WebViewScreen}
			/>
		</Stack.Navigator>
	)
}
