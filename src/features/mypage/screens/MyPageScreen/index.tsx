import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ENV } from '@/config/ENV'
import { Club } from '@/entities/club'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { LOGIN_TOKEN } from '@/shared/constants/localStorage'
import { SCREEN_TYPE } from '@/shared/constants/screen'
import { useManageClubBottomSheet } from '@/shared/contexts/manageClubBottomSheet'
import { useProfile } from '@/shared/contexts/profileContext'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { useUserVoiceBottomSheet } from '@/shared/contexts/userVoiceBottomSheetContext'
import { s, vs, ms } from '@/shared/utils/scale'
import { navigation } from '@/shared/utils/navigation'
import { setToken } from '@/shared/utils/api'
import AlertModal from '@/shared/components/AlertModal'
import React, { useContext, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'
import Toast from 'react-native-toast-message'
import Icon from 'react-native-vector-icons/MaterialIcons'

const MyPageScreen = () => {
	const { authService } = useContext(serviceContext)
	const { openBottomSheet: openUserVoice } = useUserVoiceBottomSheet()
	const { openBottomSheet: openManageClub } = useManageClubBottomSheet()
	const queryClient = useQueryClient()
	const { user, setUser } = useProfile()
	const { data: manageClubs, isLoading: isLoadingManageClubs } = useManageClubs()

	const [logoutModalVisible, setLogoutModalVisible] = useState(false)
	const [leaveModalVisible, setLeaveModalVisible] = useState(false)

	const handleLeave = () => setLeaveModalVisible(true)

	const confirmLeave = async () => {
		try {
			await authService.leave()
		} catch {
			Toast.show({ type: 'info', text1: '탈퇴 처리 중 오류가 발생했어요' })
			return
		}
		await AsyncStorage.removeItem(LOGIN_TOKEN)
		setToken(null)
		setUser(null)
		queryClient.clear()
		navigation.navigate(SCREEN_TYPE.HOME)
		Toast.show({ type: 'info', text1: '회원 탈퇴 되었어요!' })
	}

	const handleLogout = () => setLogoutModalVisible(true)

	const confirmLogout = async () => {
		await authService.logout().catch(() => {})
		setToken(null)
		setUser(null)
		queryClient.setQueryData(['savedClubs'], { clubs: [], totalSize: 0 })
		queryClient.invalidateQueries(['recentSearches'])
		queryClient.removeQueries(['manageClubs'])
		queryClient.removeQueries(['myClubReview'])
		navigation.navigate(SCREEN_TYPE.HOME)
		Toast.show({ type: 'info', text1: '로그아웃 되었어요!' })
	}

	const openManageClubDetailPage = async (club: Club) => {
		const authorization = await AsyncStorage.getItem(LOGIN_TOKEN)

		if (!authorization) return

		navigation.navigate(SCREEN_TYPE.WEBVIEW, {
			uri: ENV.WEB_URL + '/c/edit/' + club.uuid,
			authorization,
		})
	}

	const handleMoveEditProfilePage = () => {
		navigation.navigate(SCREEN_TYPE.EDIT_PROFILE)
	}

	const handleOpenTerms = () => {
		navigation.navigate(SCREEN_TYPE.WEBVIEW, {
			uri: 'https://www.all-clear.cc/terms/terms-of-service',
			title: '서비스 이용약관',
		})
	}

	const handleOpenPrivacyPolicy = () => {
		navigation.navigate(SCREEN_TYPE.WEBVIEW, {
			uri: 'https://www.all-clear.cc/terms/privacy-policy',
			title: '개인정보 처리방침',
		})
	}

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.card}>
					<Pressable
						style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
						onPress={handleMoveEditProfilePage}>
						<Image source={require('@/assets/icons/edit-pencil.png')} style={styles.editIcon} />
					</Pressable>
					<View style={styles.profileImageContainer}>
						<Image
							source={require('@/assets/images/mypage/snu-logo.png')}
							style={styles.profileImage}
						/>
					</View>
					<Text style={styles.name}>{user?.nickname || '이름 정보가 없습니다'}</Text>
					<Text style={styles.profileSub}>
						{user?.college
							? user.major
								? `${user.college} ${user.major}`
								: user.college
							: '단과대 정보가 없습니다'}
					</Text>
					<Text style={styles.profileSub}>
						{user?.admissionClass != null
							? `${String(user.admissionClass).padStart(2, '0')}학번`
							: '학번 정보가 없습니다'}
					</Text>
				</View>

				{isLoadingManageClubs && (
					<View style={styles.card}>
						<SkeletonPlaceholder borderRadius={ms(4)}>
							<SkeletonPlaceholder.Item flexDirection="row" alignItems="center">
								<SkeletonPlaceholder.Item>
									<SkeletonPlaceholder.Item width={220} height={16} />
									<SkeletonPlaceholder.Item marginTop={8} width={180} height={12} />
								</SkeletonPlaceholder.Item>
							</SkeletonPlaceholder.Item>
						</SkeletonPlaceholder>
					</View>
				)}

				{manageClubs && manageClubs.length > 0 && (
					<View style={styles.card}>
						{manageClubs.map(club => (
							<Pressable
								key={club.uuid}
								style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
								onPress={() => openManageClubDetailPage(club)}>
								<View style={styles.managerRow}>
									<Text style={styles.menuText}>{club.name}</Text>
									<Icon name="chevron-right" color={Colors.BODYTEXT_SUB} size={ms(16)} />
								</View>
							</Pressable>
						))}
						<Pressable
							style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
							onPress={openManageClub}>
							<View style={styles.managerRow}>
								<Text style={styles.menuText}>관리 중인 동아리 추가하기</Text>
								<Icon name="add-circle-outline" color={Colors.BODYTEXT_SUB} size={ms(18)} />
							</View>
						</Pressable>
					</View>
				)}

				<Pressable
					style={({ pressed }) => [styles.card, pressed && styles.pressed]}
					onPress={openManageClub}>
					<View style={styles.managerRow}>
						<View>
							<Text style={styles.managerTitle}>동아리 운영진이신가요?</Text>
							<Text style={styles.managerSub}>동아리 등록하기</Text>
						</View>
						<Icon name="chevron-right" color={Colors.POINTCOLOR} size={ms(20)} />
					</View>
				</Pressable>

				<View style={styles.card}>
					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
						onPress={openUserVoice}>
						<Text style={styles.menuText}>개발자에게 요청하기</Text>
					</Pressable>
					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
						onPress={handleOpenTerms}>
						<Text style={styles.menuText}>서비스 이용약관</Text>
					</Pressable>
					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
						onPress={handleOpenPrivacyPolicy}>
						<Text style={styles.menuText}>개인정보 처리방침</Text>
					</Pressable>
				</View>

				<View style={styles.card}>
					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
						onPress={handleLogout}>
						<Text style={styles.menuText}>로그아웃</Text>
					</Pressable>
					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
						onPress={handleLeave}>
						<Text style={styles.menuText}>회원 탈퇴</Text>
					</Pressable>
				</View>
			</ScrollView>

			<AlertModal
				visible={logoutModalVisible}
				onClose={() => setLogoutModalVisible(false)}
				title="로그아웃"
				description="로그아웃 하시겠습니까?"
				buttonLabel="로그아웃"
				onButtonPress={() => {
					setLogoutModalVisible(false)
					confirmLogout()
				}}
				hasCancel
			/>
			<AlertModal
				visible={leaveModalVisible}
				onClose={() => setLeaveModalVisible(false)}
				title="회원 탈퇴"
				description="정말로 탈퇴하시겠습니까?"
				buttonLabel="탈퇴"
				buttonVariant="destructive"
				onButtonPress={() => {
					setLeaveModalVisible(false)
					confirmLeave()
				}}
				hasCancel
			/>
		</SafeAreaView>
	)
}

export default MyPageScreen

const useManageClubs = () => {
	const { clubService } = useContext(serviceContext)

	const query = useQuery(['manageClubs'], () => clubService.listManageClubs(), {
		select: data => data.clubs,
	})

	return query
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	scrollContent: {
		padding: s(16),
		gap: vs(12),
	},
	card: {
		backgroundColor: Colors.WHITE,
		borderRadius: ms(12),
		paddingHorizontal: s(24),
		paddingVertical: s(20),
	},
	editButton: {
		position: 'absolute',
		top: s(20),
		right: s(20),
	},
	editIcon: {
		width: ms(22),
		height: ms(22),
	},
	profileImageContainer: {
		width: ms(48),
		height: ms(48),
		justifyContent: 'center',
		alignItems: 'center',
	},
	profileImage: {
		width: ms(48),
		height: ms(48),
	},
	name: {
		...typography.headerXL,
		color: Colors.BODYTEXT_MAIN,
		marginTop: vs(10),
	},
	profileSub: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		marginTop: vs(6),
	},
	managerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	managerTitle: {
		...typography.bodyMSemibold,
		color: Colors.POINTCOLOR,
	},
	managerSub: {
		...typography.bodySRegular,
		color: Colors.POINTCOLOR,
		opacity: 0.7,
		marginTop: vs(4),
	},
	menuItem: {
		paddingVertical: vs(10),
	},
	menuText: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
	},
	pressed: {
		opacity: 0.5,
	},
})
