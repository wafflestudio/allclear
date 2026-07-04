import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { RegisterClubScreenContainer } from '@/features/register-club/screens/RegisterClubScreenContainer'

const Stack = createNativeStackNavigator()

export function RegisterClubTab() {
	return (
		<Stack.Navigator screenOptions={{ headerBackTitleVisible: false, headerShown: false }}>
			<Stack.Screen
				name="RegisterClub"
				component={RegisterClubScreenContainer}
			/>
		</Stack.Navigator>
	)
}
