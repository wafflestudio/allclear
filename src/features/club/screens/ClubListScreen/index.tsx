import { RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { Category } from '@/entities/category'
import { CategoryMap } from '@/shared/constants/category'
import { Club } from '@/entities/club'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import React, { useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '@/shared/components/BackHeader'
import WithViewEventLog from '@/shared/hocs/WithViewEventLog'
import ClubList from '@/features/club/components/ClubList/ClubList'
import { Colors } from '@/shared/constants/colors'

type DetailsScreenRouteProp = RouteProp<StackParamList, SCREEN_TYPE.CLUB_LIST>
type DetailsScreenNavigationProp = NativeStackNavigationProp<StackParamList, SCREEN_TYPE.CLUB_LIST>

type Props = {
	route: DetailsScreenRouteProp
	navigation: DetailsScreenNavigationProp
}

const ClubListScreen = ({ route, navigation }: Props) => {
	const { name, category } = route.params
	const { data: clubs, isLoading } = useCategoryClubs({ name, category })

	if (!category) return null
	const categoryDetail = CategoryMap[category]
	const headerTitle = `${categoryDetail.name} 동아리`

	const openDetailPage = (club: Club) => {
		navigation.navigate(SCREEN_TYPE.CLUB_DETAIL, {
			uuid: club.uuid,
			category: club.category,
			entry_point: 'club_list',
		})
	}

	const handleMoveToHomePage = () => {
		navigation.navigate(SCREEN_TYPE.HOME)
	}

	return (
		<WithViewEventLog
			params={{
				screen_name: 'club_list_screen',
				category,
			}}>
			<SafeAreaView
				edges={['top', 'left', 'right']}
				style={{ flex: 1, backgroundColor: Colors.BACKGROUND_MAIN, overflow: 'scroll' }}>
				<Header title={headerTitle} onBack={handleMoveToHomePage} />
				<ClubList
					clubs={clubs}
					category={category}
					openDetailPage={openDetailPage}
					emptyPlaceholder="조건에 맞는 동아리가 없어요"
					isLoading={isLoading}
				/>
			</SafeAreaView>
		</WithViewEventLog>
	)
}

export default ClubListScreen

type UseCategoryClubsProps = {
	name?: Club['name']
	category?: Category['name']
}

const useCategoryClubs = ({ name, category }: UseCategoryClubsProps) => {
	const { clubService } = useContext(serviceContext)

	return useQuery(
		['clubs', name ?? 'name', category ?? 'category'],
		() => clubService.listClubs({ name, category }),
		{
			select: data => data.clubs,
			staleTime: Infinity,
		},
	)
}
