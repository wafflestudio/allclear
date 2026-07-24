import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { LOGIN_TOKEN } from '@/shared/constants/localStorage'
import { SCREEN_TYPE } from '@/shared/constants/screen'
import { Club, ManagedClubListItem, ManagedClubManagementStatus } from '@/entities/club'
import { UserNotification, UserNotificationType } from '@/entities/userNotification'
import { useManageClubBottomSheet } from '@/shared/contexts/manageClubBottomSheet'
import { useProfile } from '@/shared/contexts/profileContext'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { useUserVoiceBottomSheet } from '@/shared/contexts/userVoiceBottomSheetContext'
import { s, vs, ms } from '@/shared/utils/scale'
import { navigation } from '@/shared/utils/navigation'
import { setToken } from '@/shared/utils/api'
import { getClubAffiliationLabel } from '@/shared/utils/club'
import AlertModal from '@/shared/components/AlertModal'
import EditPencilButton from '@/shared/components/EditPencilButton'
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

const snuLogo = require('@/assets/images/club-management-snu-logo.png') as number

const MyPageScreen = () => {
	const { authService, clubService, userService } = useContext(serviceContext)
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

	const { data: notificationData, refetch: refetchNotifications } = useQuery({
		queryKey: ['userNotifications'],
		queryFn: () => userService.listNotifications(),
	})
	const readNotificationMutation = useMutation({
		mutationFn: (notificationId: UserNotification['id']) =>
			userService.readNotification({ id: notificationId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['userNotifications'] })
		},
	})

	useFocusEffect(
		useCallback(() => {
			refetchManageClubs()
			refetchNotifications()
		}, [refetchManageClubs, refetchNotifications]),
	)

	const manageClubs = manageClubsData ?? []
	const currentNotification = notificationData?.notifications.find(
		notification => !notification.readAt,
	)
	const notificationModalContent = currentNotification
		? getUserNotificationContent(currentNotification, manageClubs)
		: null

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

	const handleManageClub = (club: Club) => {
		navigation.navigate(SCREEN_TYPE.CLUB_MANAGEMENT, { clubId: club.uuid })
	}

	const handleReadCurrentNotification = () => {
		if (!currentNotification) return

		readNotificationMutation.mutate(currentNotification.id)
	}

	const handleCurrentNotificationAction = () => {
		if (!currentNotification) return

		handleReadCurrentNotification()
		if (currentNotification.type === 'CLUB_REGISTRATION_REJECTED' && currentNotification.clubId) {
			navigation.navigate(SCREEN_TYPE.CLUB_INFO_EDIT, {
				clubId: currentNotification.clubId,
			})
		}
	}

	const renderManageClubButtons = (club: ManagedClubListItem) => {
		if (club.managementStatus === 'APPROVED') {
			return (
				<View style={styles.manageClubButtons}>
					<TouchableOpacity
						style={styles.manageClubBtnFilled}
						activeOpacity={0.7}
						onPress={() => handleManageClub(club)}>
						<Text style={styles.manageClubBtnFilledText}>동아리 관리</Text>
					</TouchableOpacity>
				</View>
			)
		}

		if (club.managementStatus === 'REJECTED') {
			return (
				<View style={styles.manageClubButtons}>
					<TouchableOpacity
						style={styles.manageClubBtnFilled}
						activeOpacity={0.7}
						onPress={() => navigation.navigate(SCREEN_TYPE.CLUB_INFO_EDIT, { clubId: club.uuid })}>
						<Text style={styles.manageClubBtnFilledText}>수정 및 재신청</Text>
					</TouchableOpacity>
				</View>
			)
		}

		return (
			<View style={styles.manageClubButtons}>
				<View style={styles.manageClubStatusButton}>
					<Text
						style={styles.manageClubStatusButtonText}
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.85}>
						{MANAGE_CLUB_STATUS_LABEL[club.managementStatus]}
					</Text>
				</View>
			</View>
		)
	}

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				{/* 프로필 카드 */}
				<View style={styles.card}>
					<View style={styles.editButton}>
						<EditPencilButton
							accessibilityLabel="내 프로필 수정"
							onPress={handleMoveEditProfilePage}
						/>
					</View>
					<Image source={snuLogo} style={styles.profileImage} />
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
												{getClubAffiliationLabel(club)}
											</Text>
											<Text style={styles.manageClubSub} numberOfLines={1}>
												{club.shortDescription}
											</Text>
										</View>
									</View>
								</View>

								{renderManageClubButtons(club)}
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
			<AlertModal
				visible={!!currentNotification && !!notificationModalContent}
				onClose={handleReadCurrentNotification}
				title={notificationModalContent?.title ?? ''}
				description={notificationModalContent?.description}
				buttonLabel={notificationModalContent?.buttonLabel ?? '확인'}
				onButtonPress={handleCurrentNotificationAction}
				hasCancel={notificationModalContent?.hasCancel}
				cancelLabel={notificationModalContent?.cancelLabel}
				dismissOnBackdropPress={false}
				overlayColor={Colors.BACKGROUND_DIM}
				blurAmount={1}
			/>
		</SafeAreaView>
	)
}

export default MyPageScreen

const MANAGE_CLUB_STATUS_LABEL: Record<ManagedClubManagementStatus, string> = {
	APPROVED: '동아리 관리',
	REJECTED: '미승인(신청 반려)',
	PENDING: '승인 대기',
	MANAGER_REQUEST_PENDING: '운영진 권한 승인 대기',
}

type UserNotificationModalContent = {
	title: string
	description: string
	buttonLabel: string
	hasCancel?: boolean
	cancelLabel?: string
}

const USER_NOTIFICATION_CONTENT: Record<UserNotificationType, UserNotificationModalContent> = {
	CLUB_REGISTRATION_APPROVED: {
		title: '동아리 등록 신청이 승인되었어요!',
		description: '이제 동아리 공고를 등록/수정하거나,\n동아리 정보를 수정할 수 있어요',
		buttonLabel: '확인',
	},
	CLUB_REGISTRATION_REJECTED: {
		title: '동아리 등록 신청이 반려되었어요',
		description: '',
		buttonLabel: '수정 및 재신청',
		hasCancel: true,
		cancelLabel: '취소',
	},
	MANAGER_REQUEST_APPROVED: {
		title: '운영진 등록 신청이 승인되었어요!',
		description: '이제 동아리 공고를 등록/수정하거나,\n동아리 정보를 수정할 수 있어요',
		buttonLabel: '확인',
	},
	MANAGER_REQUEST_REJECTED: {
		title: '운영진 등록 신청이 반려되었어요',
		description: '',
		buttonLabel: '확인',
	},
}

const getUserNotificationContent = (
	notification: UserNotification,
	manageClubs: ManagedClubListItem[],
): UserNotificationModalContent => {
	const content = USER_NOTIFICATION_CONTENT[notification.type]

	if (
		notification.type !== 'CLUB_REGISTRATION_REJECTED' &&
		notification.type !== 'MANAGER_REQUEST_REJECTED'
	) {
		return content
	}

	const rejectReason = getNotificationRejectReason(notification, manageClubs)

	return {
		...content,
		description: rejectReason ? `사유(${rejectReason})` : '사유가 등록되지 않았어요',
	}
}

const getNotificationRejectReason = (
	notification: UserNotification,
	manageClubs: ManagedClubListItem[],
) => {
	const trimmedMetadataRejectReason = notification.metadata?.rejectReason?.trim()

	if (trimmedMetadataRejectReason) {
		return trimmedMetadataRejectReason
	}

	if (notification.type !== 'CLUB_REGISTRATION_REJECTED') {
		return undefined
	}

	const rejectedClub = manageClubs.find(
		club =>
			club.uuid === notification.clubId ||
			club.id === notification.clubId ||
			club.uuid === notification.sourceId,
	)

	return rejectedClub?.rejectReason?.trim() || undefined
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
	profileImage: {
		width: ms(40),
		height: ms(40),
		borderRadius: ms(20),
		opacity: 0.5,
		resizeMode: 'contain',
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
	manageClubStatusButton: {
		flex: 1,
		height: vs(35),
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.TEXTBOX_UNSELECTED,
		borderRadius: ms(8),
		paddingHorizontal: s(10),
	},
	manageClubStatusButtonText: {
		fontFamily: 'Apple SD Gothic Neo',
		fontWeight: '600',
		fontSize: ms(14),
		lineHeight: ms(24),
		textAlign: 'center',
		color: Colors.TEXT_BUTTON_UNSELECTED,
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
