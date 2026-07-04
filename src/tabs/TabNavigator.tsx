import {
	createBottomTabNavigator,
	type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs'
import { getFocusedRouteNameFromRoute, type RouteProp } from '@react-navigation/native'
import { Colors } from '@/shared/constants/colors'
import { SCREEN_TYPE } from '@/shared/constants/screen'
import { useProfile } from '@/shared/contexts/profileContext'
import useRequireLogin from '@/shared/hooks/useRequireLogin'
import { Image, Pressable, type ImageSourcePropType } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HomeTab } from '@/tabs/HomeTab'
import { MyPageTab } from '@/tabs/MyPageTab'
import { s, vs } from '@/shared/utils/scale'
import { navigation } from '@/shared/utils/navigation'
import { SavedTab } from './SaveTab'
import { SearchTab } from './SearchTab'
import { typography } from '@/shared/constants/typography'

const Tab = createBottomTabNavigator()

const renderHomeTabIcon = createTabBarIcon(
	require('@/assets/icons/tab/home-default.png'),
	require('@/assets/icons/tab/home-active.png'),
)
const renderExploreTabIcon = createTabBarIcon(
	require('@/assets/icons/tab/explore-default.png'),
	require('@/assets/icons/tab/explore-active.png'),
)
const renderSavedTabIcon = createTabBarIcon(
	require('@/assets/icons/tab/saved-default.png'),
	require('@/assets/icons/tab/saved-active.png'),
)
const renderMyPageTabIcon = createTabBarIcon(
	require('@/assets/icons/tab/mypage-default.png'),
	require('@/assets/icons/tab/mypage-active.png'),
)

function createTabBarIcon(
	defaultSource: ImageSourcePropType,
	activeSource: ImageSourcePropType,
): BottomTabNavigationOptions['tabBarIcon'] {
	return function TabBarIcon({ focused }) {
		return (
			<Image
				source={focused ? activeSource : defaultSource}
				style={{
					width: s(22),
					height: s(22),
					resizeMode: 'contain' as const,
					marginTop: vs(10),
				}}
			/>
		)
	}
}

export function TabNavigator() {
	const { user } = useProfile()
	const requireLogin = useRequireLogin()
	const insets = useSafeAreaInsets()
	// 안드로이드 네비게이션바 있는 경우에만 inset 적용, 나머지는 전부 미적용
	const bottomInset = insets.bottom >= 40 ? insets.bottom : 0

	const defaultTabBarStyle = {
		// 라벨 밑 ~ 하단바 끝까지의 여백을 16px 늘림 (height/paddingBottom 동시 +16)
		height: vs(70) + vs(16) + bottomInset,
		backgroundColor: Colors.BACKGROUND_SUB,
		borderTopWidth: 0, // iOS 그림자 제거
		elevation: 0, // Android 그림자 제거
		paddingBottom: vs(10) + vs(16) + bottomInset,
	}

	// 웹뷰처럼 전체 화면으로 떠야 하는 nested 화면에서는 하단 탭바를 숨긴다.
	const getTabBarStyle = (route: RouteProp<Record<string, object | undefined>, string>) => {
		const focusedRouteName = getFocusedRouteNameFromRoute(route)
		if (focusedRouteName === SCREEN_TYPE.WEBVIEW) {
			return { display: 'none' as const }
		}
		return defaultTabBarStyle
	}

	const screenOptions: BottomTabNavigationOptions = {
		headerShown: false,
		tabBarActiveTintColor: Colors.BUTTON_SELECTED,
		tabBarInactiveTintColor: Colors.BUTTON_UNSELECTED,
		tabBarLabelStyle: {
			...typography.bodySMedium,
		},
		tabBarButton: props => (
			<Pressable
				{...props}
				style={({ pressed }) => [props.style, { opacity: pressed ? 0.6 : 1 }]}
			/>
		),
	}

	return (
		<Tab.Navigator
			screenOptions={{
				...screenOptions,
				tabBarStyle: defaultTabBarStyle,
			}}>
			<Tab.Screen
				options={({ route }) => ({
					tabBarIcon: renderHomeTabIcon,
					tabBarStyle: getTabBarStyle(route),
				})}
				name="홈"
				component={HomeTab}
			/>
			<Tab.Screen
				options={({ route }) => ({
					tabBarIcon: renderExploreTabIcon,
					tabBarStyle: getTabBarStyle(route),
				})}
				name="탐색"
				component={SearchTab}
			/>
			<Tab.Screen
				options={({ route }) => ({
					tabBarIcon: renderSavedTabIcon,
					tabBarStyle: getTabBarStyle(route),
				})}
				name="저장"
				component={SavedTab}
				listeners={{
					tabPress: e => {
						if (!user) {
							e.preventDefault()
							requireLogin(() => navigation.navigate('저장'))
						}
					},
				}}
			/>
			<Tab.Screen
				options={({ route }) => ({
					tabBarIcon: renderMyPageTabIcon,
					tabBarStyle: getTabBarStyle(route),
				})}
				name="마이"
				component={MyPageTab}
				listeners={({ navigation: tabNavigation }) => ({
					tabPress: e => {
						e.preventDefault()
						requireLogin(() => tabNavigation.navigate('마이', { screen: SCREEN_TYPE.MYPAGE }))
					},
				})}
			/>
		</Tab.Navigator>
	)
}
