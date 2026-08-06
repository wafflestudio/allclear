import { type RouteProp, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AnnouncementForm from "@/features/club/components/AnnouncementForm";
import type { SCREEN_TYPE, StackParamList } from "@/shared/constants/screen";

type NavigationProp = NativeStackNavigationProp<
	StackParamList,
	SCREEN_TYPE.ANNOUNCEMENT_REGISTRATION
>;
type ScreenRouteProp = RouteProp<
	StackParamList,
	SCREEN_TYPE.ANNOUNCEMENT_REGISTRATION
>;

type Props = {
	navigation: NavigationProp;
};

const AnnouncementRegistrationScreen = ({ navigation }: Props) => {
	const route = useRoute<ScreenRouteProp>();
	return (
		<AnnouncementForm
			mode="create"
			clubId={route.params.clubId}
			onSuccess={() => navigation.goBack()}
		/>
	);
};

export default AnnouncementRegistrationScreen;
