import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { LOGIN_TOKEN } from '@/shared/constants/localStorage'
import { SCREEN_TYPE } from '@/shared/constants/screen'
import { Club } from '@/entities/club'
import { useManageClubBottomSheet } from '@/shared/contexts/manageClubBottomSheet'
import { useProfile } from '@/shared/contexts/profileContext'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { useUserVoiceBottomSheet } from '@/shared/contexts/userVoiceBottomSheetContext'
import { s, vs, ms } from '@/shared/utils/scale'
import { navigation } from '@/shared/utils/navigation'
import { setToken } from '@/shared/utils/api'
import AlertModal from '@/shared/components/AlertModal'
import React, { useCallback, useContext, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import Icon from 'react-native-vector-icons/MaterialIcons'

const MyPageScreen = () => {
	const { authService, clubService } = useContext(serviceContext)
	const { openBottomSheet: openUserVoice } = useUserVoiceBottomSheet()
	const { openBottomSheet: openManageClub } = useManageClubBottomSheet()
	const queryClient = useQueryClient()
	const { user, setUser } = useProfile()

	const [logoutModalVisible, setLogoutModalVisible] = useState(false)
	const [leaveModalVisible, setLeaveModalVisible] = useState(false)

	const { data: manageClubsData, refetch: refetchManageClubs } = useQuery({
		queryKey: ['manageClubs'],
		queryFn: () => clubService.listManageClubs(),
		select: data => data.clubs,
	})

	useFocusEffect(
		useCallback(() => {
			refetchManageClubs()
		}, [refetchManageClubs]),
	)

	const manageClubs = manageClubsData ?? []

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

	const handleRegisterAnnouncement = (club: Club) => {
		navigation.navigate(SCREEN_TYPE.ANNOUNCEMENT_REGISTRATION, { clubId: club.uuid })
	}

	const handleManageClub = (club: Club) => {
		navigation.navigate(SCREEN_TYPE.CLUB_MANAGEMENT, { clubId: club.uuid })
	}

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				{/* 프로필 카드 */}
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

				{/* 동아리 운영진이신가요? 카드 */}
				<Pressable
					style={({ pressed }) => [styles.managerCard, pressed && styles.pressed]}
					onPress={openManageClub}>
					<View style={styles.managerRow}>
						<View>
							<Text style={styles.managerTitle}>동아리 운영진이신가요?</Text>
							<Text style={styles.managerSub}>신규 동아리 등록하기</Text>
						</View>
						<Icon name="chevron-right" color={Colors.POINTCOLOR} size={ms(20)} />
					</View>
				</Pressable>

				{/* 관리 중인 동아리 가로 스크롤 */}
				{manageClubs.length > 0 && (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.manageClubsScroll}>
						{manageClubs.map(club => (
							<View key={club.uuid} style={styles.manageClubItem}>
								{/* 동아리 정보 카드 */}
								<View style={styles.manageClubInfoCard}>
									<View style={styles.manageClubThumbnail}>
										{club.imageUri ? (
											<Image
												source={{ uri: club.imageUri }}
												style={styles.manageClubThumbnailImage}
											/>
										) : null}
									</View>
									<View style={styles.manageClubTexts}>
										<Text style={styles.manageClubName} numberOfLines={1}>
											{club.name}
										</Text>
										<View style={styles.manageClubSubTexts}>
											<Text style={styles.manageClubSub} numberOfLines={1}>
												{club.college}
											</Text>
											<Text style={styles.manageClubSub} numberOfLines={1}>
												{club.description}
											</Text>
										</View>
									</View>
								</View>

								{/* 버튼 행 */}
								<View style={styles.manageClubButtons}>
									<TouchableOpacity
										style={styles.manageClubBtnOutline}
										activeOpacity={0.7}
										onPress={() => handleRegisterAnnouncement(club)}>
										<Text style={styles.manageClubBtnOutlineText}>공고 등록</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={styles.manageClubBtnFilled}
										activeOpacity={0.7}
										onPress={() => handleManageClub(club)}>
										<Text style={styles.manageClubBtnFilledText}>동아리 관리</Text>
									</TouchableOpacity>
								</View>
							</View>
						))}
					</ScrollView>
				)}

				{/* 기타 메뉴 */}
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

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	scrollContent: {
		padding: s(16),
		gap: vs(12),
	},

	// 프로필 카드
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

	// 운영진 카드
	managerCard: {
		backgroundColor: '#FAFAFA',
		borderRadius: ms(12),
		paddingHorizontal: s(24),
		paddingVertical: vs(20),
	},
	managerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	managerTitle: {
		...typography.bodyMMedium,
		color: Colors.POINTCOLOR,
		letterSpacing: -0.02 * 14,
	},
	managerSub: {
		...typography.bodySRegular,
		color: Colors.POINTCOLOR,
		opacity: 0.4,
		marginTop: vs(4),
		letterSpacing: -0.02 * 12,
	},

	// 관리 동아리 스크롤
	manageClubsScroll: {
		gap: s(10),
		paddingRight: s(4),
	},
	manageClubItem: {
		width: s(330),
		gap: vs(10),
	},
	manageClubInfoCard: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: vs(20),
		paddingLeft: s(30),
		paddingRight: s(20),
		gap: s(30),
		backgroundColor: '#FAFAFA',
		borderRadius: ms(10),
		height: vs(120),
	},
	manageClubThumbnail: {
		width: ms(75),
		height: ms(75),
		borderRadius: ms(10),
		backgroundColor: '#D9D9D9',
		overflow: 'hidden',
		flexShrink: 0,
	},
	manageClubThumbnailImage: {
		width: '100%',
		height: '100%',
	},
	manageClubTexts: {
		flex: 1,
		gap: vs(10),
	},
	manageClubName: {
		fontFamily: 'Pretendard',
		fontWeight: '700',
		fontSize: ms(17),
		lineHeight: ms(24),
		letterSpacing: -0.02 * 17,
		color: '#202020',
	},
	manageClubSubTexts: {
		gap: vs(5),
	},
	manageClubSub: {
		fontFamily: 'Pretendard',
		fontWeight: '400',
		fontSize: ms(13),
		lineHeight: ms(15),
		letterSpacing: -0.02 * 13,
		color: '#757474',
	},

	// 버튼 행
	manageClubButtons: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: s(10),
	},
	manageClubBtnOutline: {
		flex: 1,
		height: vs(35),
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
		borderRadius: ms(8),
	},
	manageClubBtnOutlineText: {
		fontFamily: 'Apple SD Gothic Neo',
		fontWeight: '600',
		fontSize: ms(14),
		lineHeight: ms(24),
		textAlign: 'center',
		letterSpacing: -0.02 * 14,
		color: Colors.POINTCOLOR,
	},
	manageClubBtnFilled: {
		flex: 1,
		height: vs(35),
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.POINTCOLOR,
		borderRadius: ms(8),
	},
	manageClubBtnFilledText: {
		fontFamily: 'Apple SD Gothic Neo',
		fontWeight: '600',
		fontSize: ms(14),
		lineHeight: ms(24),
		textAlign: 'center',
		letterSpacing: -0.02 * 14,
		color: Colors.WHITE,
	},

	// 메뉴
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
