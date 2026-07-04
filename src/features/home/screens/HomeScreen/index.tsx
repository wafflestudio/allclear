import { RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Club } from '@/entities/club'
import { Colors } from '@/shared/constants/colors'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import WithViewEventLog from '@/shared/hocs/WithViewEventLog'
import useClickEventLog from '@/shared/hooks/useClickEventLog'
import { SafeAreaView } from 'react-native-safe-area-context'
import CategorySection from '@/features/home/components/CategorySection'
import LatestClubsSection from '@/features/home/components/LatestClubsSection'
import { View, Text, Image, StyleSheet } from 'react-native'
import { s, vs } from '@/shared/utils/scale'
import { typography } from '@/shared/constants/typography'

type DetailsScreenRouteProp = RouteProp<StackParamList, SCREEN_TYPE.HOME>
type DetailsScreenNavigationProp = NativeStackNavigationProp<StackParamList, SCREEN_TYPE.HOME>

type Props = {
	route: DetailsScreenRouteProp
	navigation: DetailsScreenNavigationProp
}

const HomeScreen = ({ navigation }: Props) => {
	const { logClickEvent } = useClickEventLog()

	const handleMoveToDetailPage = (club: Club) => {
		logClickEvent({
			screen_name: 'home_screen',
			screen_component_name: 'rolling_banner_card',
			category: club.category,
		})

		navigation.navigate(SCREEN_TYPE.CLUB_DETAIL, {
			uuid: club.uuid,
			category: club.category,
			entry_point: 'home',
		})
	}

	return (
		<WithViewEventLog params={{ screen_name: 'home_screen' }}>
			<SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
				<View style={styles.headerContainer}>
					<Text style={styles.subtitle}>서울대 모든 동아리</Text>
					<Image style={styles.logo} source={require('@/assets/images/header/allclear.png')} />
				</View>

				<View style={styles.categoryContainer}>
					<Text style={styles.sectionTitle}>어떤 동아리든 올클과 함께 찾아봐요</Text>
					<CategorySection />
				</View>

				<View style={styles.latestClubsContainer}>
					<Text style={[styles.sectionTitle, styles.latestClubsTitle]}>
						새로운 공고가 올라왔어요
					</Text>
					<LatestClubsSection openDetailPage={handleMoveToDetailPage} />
				</View>
			</SafeAreaView>
		</WithViewEventLog>
	)
}

export default HomeScreen

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_MAIN,
		alignItems: 'center',
		paddingTop: vs(32),
	},
	headerContainer: {
		width: s(353),
		alignItems: 'flex-start',
		marginLeft: s(4),
		marginBottom: vs(40),
	},
	subtitle: {
		...typography.bodySMedium,
		color: Colors.BODYTEXT_MAIN,
	},
	logo: {
		width: s(106),
		height: s(34),
		marginTop: vs(6),
		resizeMode: 'contain',
	},
	categoryContainer: {
		width: s(353),
		alignItems: 'flex-start',
		marginBottom: vs(30),
	},
	sectionTitle: {
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_SUB,
		marginLeft: s(4),
		marginBottom: vs(16),
	},
	latestClubsContainer: {
		width: '100%',
	},
	latestClubsTitle: {
		marginLeft: s(20),
	},
})
