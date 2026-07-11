import AsyncStorage from '@react-native-async-storage/async-storage'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import { ENV } from '@/config/ENV'
import { serviceContext } from '@/shared/contexts/serviceContext'
import 'dayjs/locale/ko'
import { ManagedClubListItem } from '@/entities/club'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import React, { useContext } from 'react'
import { FlatList, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ClubCard from '@/features/club/components/ClubList/ClubCard'
import { LOGIN_TOKEN } from '@/shared/constants/localStorage'
import Header from '@/features/mypage/screens/ManageClubListScreen/Header'

type ScreenNavigationProp = NativeStackNavigationProp<StackParamList, SCREEN_TYPE.WEBVIEW>

type Props = {
	navigation: ScreenNavigationProp
}

const ManageClubListScreen = ({ navigation }: Props) => {
	const { data: manageClubs } = useManageClubs()

	const handleMoveToHomePage = () => navigation.goBack()

	const openManageClubDetailPage = async (club: ManagedClubListItem) => {
		if (club.managementStatus !== 'APPROVED') return

		const authorization = await AsyncStorage.getItem(LOGIN_TOKEN)

		if (!authorization) return

		navigation.navigate(SCREEN_TYPE.WEBVIEW, {
			uri: ENV.WEB_URL + '/c/edit/' + club.uuid,
			authorization,
		})
	}

	return (
		<SafeAreaView
			edges={['top', 'left', 'right']}
			style={{
				flex: 1,
				padding: 0,
				overflow: 'scroll',
			}}>
			<Header onBack={handleMoveToHomePage} />
			<Text
				style={{
					marginHorizontal: 16,
					fontSize: 20,
					fontWeight: 'bold',
					padding: 10,
					marginBottom: 10,
				}}>
				동아리 정보 수정
			</Text>
			<FlatList
				nestedScrollEnabled
				keyExtractor={item =>
					`${item.uuid}-${item.managementStatus}-${item.managerRequestId ?? ''}`
				}
				data={manageClubs}
				renderItem={({ item }) => {
					const isEditable = item.managementStatus === 'APPROVED'

					return (
						<TouchableOpacity
							disabled={!isEditable}
							activeOpacity={isEditable ? 0.2 : 1}
							onPress={() => openManageClubDetailPage(item)}>
							<ClubCard club={item} />
						</TouchableOpacity>
					)
				}}
				// Performance settings
				removeClippedSubviews={true} // Unmount components when outside of window
				initialNumToRender={6} // Reduce initial render amount
				maxToRenderPerBatch={1} // Reduce number in each render batch
				updateCellsBatchingPeriod={100} // Increase time between renders
				windowSize={7} // Reduce the window size
			/>
		</SafeAreaView>
	)
}

export default ManageClubListScreen

const useManageClubs = () => {
	const { clubService } = useContext(serviceContext)

	const query = useQuery(['manageClubs'], () => clubService.listManageClubs(), {
		select: data => data.clubs,
	})

	return query
}
