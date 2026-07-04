import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp, useRoute } from '@react-navigation/native'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import AnnouncementForm from '@/features/club/components/AnnouncementForm'

type NavigationProp = NativeStackNavigationProp<StackParamList, SCREEN_TYPE.ANNOUNCEMENT_EDIT>
type ScreenRouteProp = RouteProp<StackParamList, SCREEN_TYPE.ANNOUNCEMENT_EDIT>

type Props = {
	navigation: NavigationProp
}

const AnnouncementEditScreen = ({ navigation }: Props) => {
	const route = useRoute<ScreenRouteProp>()
	return (
		<AnnouncementForm
			mode="edit"
			recruitmentId={route.params.recruitmentId}
			onSuccess={() => navigation.goBack()}
		/>
	)
}

export default AnnouncementEditScreen
