import React, { useCallback, useContext, useState } from 'react'
import {
	ActivityIndicator,
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Icon from 'react-native-vector-icons/MaterialIcons'

const snuLogo = require('@/assets/images/mypage/snu-logo.png') as number

import { Colors } from '@/shared/constants/colors'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { ms, s, vs } from '@/shared/utils/scale'
import { navigation } from '@/shared/utils/navigation'

type RouteProps = RouteProp<StackParamList, typeof SCREEN_TYPE.CLUB_MANAGEMENT>

const VISIBLE_COUNT = 2

type DeleteTarget = { id: number; title: string } | null

const ClubManagementScreen = () => {
	const route = useRoute<RouteProps>()
	const { clubId } = route.params

	const { clubService, recruitmentService } = useContext(serviceContext)
	const queryClient = useQueryClient()

	const [showMore, setShowMore] = useState(false)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
	const [deletedTitle, setDeletedTitle] = useState<string | null>(null)

	const { data: club } = useQuery({
		queryKey: ['managedClub', clubId],
		queryFn: () => clubService.getManagedClubDetail({ uuid: clubId }),
	})

	const {
		data: recruitmentsData,
		isLoading,
		refetch: refetchRecruitments,
	} = useQuery({
		queryKey: ['clubRecruitments', clubId],
		queryFn: () => recruitmentService.listClubRecruitments({ clubId }),
	})

	useFocusEffect(
		useCallback(() => {
			refetchRecruitments()
		}, [refetchRecruitments]),
	)

	const { mutate: deleteRecruitment, isPending: isDeleting } = useMutation({
		mutationFn: (recruitmentId: number) => recruitmentService.deleteRecruitment({ recruitmentId }),
		onSuccess: () => {
			const title = deleteTarget?.title ?? ''
			setDeleteTarget(null)
			setDeletedTitle(title)
			queryClient.invalidateQueries({ queryKey: ['clubRecruitments', clubId] })
		},
		onError: () => {
			setDeleteTarget(null)
		},
	})

	const recruitments = recruitmentsData?.recruitments ?? []
	const activeRecruitment = recruitments.find(r => r.is_active) ?? null
	const hasMore = recruitments.length > VISIBLE_COUNT

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
			{/* 헤더 */}
			<View style={styles.header}>
				<Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
					<Icon name="chevron-left" size={ms(24)} color="#757474" />
				</Pressable>
				<Text style={styles.headerTitle}>동아리 관리</Text>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				{/* 동아리 카드 */}
				<View style={styles.clubCard}>
					{club?.imageUri ? (
						<Image source={{ uri: club.imageUri }} style={styles.clubCardBg} />
					) : (
						<View style={[styles.clubCardBg, { backgroundColor: '#E8E4F0' }]} />
					)}
					<View style={styles.clubCardOverlay} />
					<View style={styles.clubCardContent}>
						<View style={styles.clubCardTop}>
							<View style={styles.clubLogo}>
								<Image source={snuLogo} style={styles.clubLogoImage} />
							</View>
							<View style={styles.editIconWrapper}>
								<Icon name="edit" size={ms(20)} color="#8F8686" style={{ opacity: 0.5 }} />
							</View>
						</View>
						<View style={styles.clubTexts}>
							<Text style={styles.clubName} numberOfLines={1}>
								{club?.name ?? ''}
							</Text>
							<Text style={styles.clubCollege} numberOfLines={1}>
								{club?.college ?? ''}
							</Text>
							<Text style={styles.clubDesc} numberOfLines={1}>
								{club?.description ?? ''}
							</Text>
						</View>
					</View>
				</View>

				{/* 공고 관리 */}
				<View style={styles.section}>
					<View style={styles.sectionLabel}>
						<Text style={styles.sectionLabelText}>공고 관리</Text>
					</View>

					<View style={styles.listContainer}>
						{/* 새 공고 작성하기 버튼 */}
						<TouchableOpacity
							style={styles.newAnnouncementRow}
							activeOpacity={0.6}
							onPress={() =>
								navigation.navigate(SCREEN_TYPE.ANNOUNCEMENT_REGISTRATION, { clubId })
							}>
							<Text style={styles.newAnnouncementText}>새 공고 작성하기</Text>
							<Icon name="edit" size={ms(16)} color={Colors.POINTCOLOR} />
						</TouchableOpacity>

						{/* 공고 목록 */}
						{isLoading ? (
							<ActivityIndicator color={Colors.POINTCOLOR} style={{ marginVertical: vs(16) }} />
						) : recruitments.length === 0 ? (
							<View style={[styles.row, styles.rowNormal]}>
								<Text style={styles.rowTextGray}>등록된 공고가 없어요</Text>
							</View>
						) : (
							<>
								{/* 현재 공고 - 상단 고정 표시 */}
								{activeRecruitment && (
									<View style={[styles.row, styles.rowActive]}>
										<View style={styles.rowLeft}>
											<View style={styles.badge}>
												<Text style={styles.badgeText}>현재 공고</Text>
											</View>
											<Text style={styles.rowTextGray} numberOfLines={1}>
												{activeRecruitment.display_title}
											</Text>
										</View>
										<View style={styles.rowIcons}>
											<Pressable
												hitSlop={8}
												onPress={() =>
													navigation.navigate(SCREEN_TYPE.ANNOUNCEMENT_EDIT, {
														recruitmentId: activeRecruitment.id,
													})
												}>
												<Icon name="edit" size={ms(16)} color="#C1C1C1" />
											</Pressable>
											<Pressable
												hitSlop={8}
												onPress={() =>
													setDeleteTarget({
														id: activeRecruitment.id,
														title: activeRecruitment.display_title,
													})
												}>
												<Icon name="delete" size={ms(16)} color="#C1C1C1" />
											</Pressable>
										</View>
									</View>
								)}

								{/* 전체 목록 (현재 공고 포함, 배지 없이 동일 스타일) */}
								{recruitments.slice(0, VISIBLE_COUNT).map(item => (
									<View key={item.id} style={[styles.row, styles.rowNormal]}>
										<View style={styles.rowLeft}>
											<Text style={styles.rowTextGray} numberOfLines={1}>
												{item.display_title}
											</Text>
										</View>
										<View style={styles.rowIcons}>
											<Pressable
												hitSlop={8}
												onPress={() =>
													navigation.navigate(SCREEN_TYPE.ANNOUNCEMENT_EDIT, {
														recruitmentId: item.id,
													})
												}>
												<Icon name="edit" size={ms(16)} color="#C1C1C1" />
											</Pressable>
											<Pressable
												hitSlop={8}
												onPress={() => setDeleteTarget({ id: item.id, title: item.display_title })}>
												<Icon name="delete" size={ms(16)} color="#C1C1C1" />
											</Pressable>
										</View>
									</View>
								))}

								{hasMore && (
									<Pressable
										style={[styles.row, styles.rowMore]}
										onPress={() => setShowMore(prev => !prev)}>
										<Text style={styles.rowMoreText}>이전 공고 더보기</Text>
										<Icon
											name={showMore ? 'expand-less' : 'expand-more'}
											size={ms(18)}
											color={Colors.POINTCOLOR}
										/>
									</Pressable>
								)}

								{showMore &&
									recruitments.slice(VISIBLE_COUNT).map(item => (
										<View key={item.id} style={[styles.row, styles.rowMore]}>
											<View style={styles.rowLeft}>
												<Text style={styles.rowTextGray} numberOfLines={1}>
													{item.display_title}
												</Text>
											</View>
											<View style={styles.rowIcons}>
												<Pressable
													hitSlop={8}
													onPress={() =>
														navigation.navigate(SCREEN_TYPE.ANNOUNCEMENT_EDIT, {
															recruitmentId: item.id,
														})
													}>
													<Icon name="edit" size={ms(16)} color="#C1C1C1" />
												</Pressable>
												<Pressable
													hitSlop={8}
													onPress={() =>
														setDeleteTarget({ id: item.id, title: item.display_title })
													}>
													<Icon name="delete" size={ms(16)} color="#C1C1C1" />
												</Pressable>
											</View>
										</View>
									))}
							</>
						)}
					</View>
				</View>

				{/* 운영진 목록 */}
				<View style={styles.section}>
					<View style={styles.sectionLabel}>
						<Text style={styles.sectionLabelText}>운영진 목록</Text>
					</View>
					<View style={styles.listContainer}>
						{!club?.managers || club.managers.length === 0 ? (
							<View style={[styles.row, styles.rowNormal, { justifyContent: 'center' }]}>
								<Text style={styles.rowTextGray}>등록된 운영진이 없어요</Text>
							</View>
						) : (
							club.managers.map(manager => (
								<View key={manager.serviceUserId} style={[styles.row, styles.rowNormal]}>
									<Text style={styles.managerName}>{manager.name}</Text>
									{!!manager.studentId && (
										<Text style={styles.managerStudentId}>{manager.studentId}</Text>
									)}
								</View>
							))
						)}
					</View>
				</View>
			</ScrollView>

			{/* 삭제 확인 모달 */}
			<Modal
				visible={deleteTarget !== null}
				transparent
				animationType="fade"
				onRequestClose={() => !isDeleting && setDeleteTarget(null)}>
				<Pressable style={styles.modalOverlay} onPress={() => !isDeleting && setDeleteTarget(null)}>
					<BlurView
						style={StyleSheet.absoluteFillObject}
						blurType="light"
						blurAmount={1}
						overlayColor="transparent"
						reducedTransparencyFallbackColor="transparent"
					/>
					<Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
						{/* Contents */}
						<View style={styles.modalContents}>
							<Text style={styles.modalTitle}>{deleteTarget?.title ?? ''} 삭제</Text>
							<Text style={styles.modalDesc}>공고를 삭제하면 되돌릴 수 없어요.</Text>
						</View>
						{/* Actions */}
						<View style={styles.modalActions}>
							<TouchableOpacity
								style={styles.modalCancelBtn}
								onPress={() => setDeleteTarget(null)}
								disabled={isDeleting}
								activeOpacity={0.6}>
								<Text style={styles.modalCancelText}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalConfirmBtn, isDeleting && { opacity: 0.6 }]}
								onPress={() => deleteTarget && deleteRecruitment(deleteTarget.id)}
								disabled={isDeleting}
								activeOpacity={0.6}>
								<Text style={styles.modalConfirmText}>{isDeleting ? '삭제 중...' : '삭제'}</Text>
							</TouchableOpacity>
						</View>
					</Pressable>
				</Pressable>
			</Modal>

			{/* 삭제 완료 모달 */}
			<Modal
				visible={deletedTitle !== null}
				transparent
				animationType="fade"
				onRequestClose={() => setDeletedTitle(null)}>
				<Pressable style={styles.modalOverlay} onPress={() => setDeletedTitle(null)}>
					<BlurView
						style={StyleSheet.absoluteFillObject}
						blurType="light"
						blurAmount={1}
						overlayColor="transparent"
						reducedTransparencyFallbackColor="transparent"
					/>
					<Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
						<View style={styles.modalContents}>
							<Text style={styles.modalTitle}>
								{deletedTitle}
								<Text style={styles.modalTitleBlack}>{'가 삭제되었어요.'}</Text>
							</Text>
						</View>
						<TouchableOpacity
							style={styles.modalSingleBtn}
							activeOpacity={0.6}
							onPress={() => setDeletedTitle(null)}>
							<Text style={styles.modalConfirmText}>확인</Text>
						</TouchableOpacity>
					</Pressable>
				</Pressable>
			</Modal>
		</SafeAreaView>
	)
}

export default ClubManagementScreen

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},

	// ── 헤더
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: s(20),
		gap: s(105),
		height: vs(39),
		backgroundColor: '#FFFFFF',
	},
	backBtn: {
		width: ms(24),
		height: ms(24),
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		fontFamily: 'Pretendard',
		fontWeight: '600',
		fontSize: ms(16),
		lineHeight: ms(19),
		letterSpacing: -0.02 * 16,
		color: '#757474',
	},

	// ── 스크롤 영역
	scroll: {
		flex: 1,
		backgroundColor: '#F5F4F0',
	},
	scrollContent: {
		paddingHorizontal: s(20),
		paddingTop: vs(10),
		paddingBottom: vs(40),
		gap: vs(20),
	},

	// ── 동아리 카드
	clubCard: {
		borderRadius: ms(12),
		overflow: 'hidden',
		height: vs(160),
	},
	clubCardBg: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	clubCardOverlay: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		backgroundColor: 'rgba(255,255,255,0.45)',
	},
	clubCardContent: {
		flex: 1,
		padding: s(16),
		justifyContent: 'space-between',
	},
	clubCardTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	clubLogo: {
		width: ms(40),
		height: ms(40),
		borderRadius: ms(8),
		backgroundColor: '#FFFFFF',
		overflow: 'hidden',
	},
	clubLogoImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'contain',
	},
	editIconWrapper: {
		width: ms(24),
		height: ms(24),
		justifyContent: 'center',
		alignItems: 'center',
	},
	clubTexts: {
		gap: vs(4),
	},
	clubName: {
		fontFamily: 'Pretendard',
		fontWeight: '700',
		fontSize: ms(20),
		lineHeight: ms(24),
		letterSpacing: -0.02 * 20,
		color: '#000000',
	},
	clubCollege: {
		fontFamily: 'Pretendard',
		fontWeight: '500',
		fontSize: ms(14),
		lineHeight: ms(17),
		letterSpacing: -0.02 * 14,
		color: '#757474',
	},
	clubDesc: {
		fontFamily: 'Pretendard',
		fontWeight: '500',
		fontSize: ms(14),
		lineHeight: ms(17),
		letterSpacing: -0.02 * 14,
		color: '#757474',
	},

	// ── 섹션
	section: {
		gap: 0,
	},
	sectionLabel: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingTop: vs(5),
		paddingBottom: vs(5),
		paddingLeft: s(5),
		paddingRight: s(12),
		height: vs(34),
	},
	sectionLabelText: {
		fontFamily: 'Pretendard',
		fontWeight: '500',
		fontSize: ms(14),
		lineHeight: ms(24),
		color: '#757474',
		flex: 1,
	},

	// ── 리스트 컨테이너
	listContainer: {
		gap: vs(10),
	},

	// ── 새 공고 작성하기
	newAnnouncementRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: vs(10),
		paddingHorizontal: s(15),
		borderRadius: ms(12),
		minHeight: vs(34),
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
	},
	newAnnouncementText: {
		fontFamily: 'Pretendard',
		fontWeight: '500',
		fontSize: ms(12),
		lineHeight: ms(14),
		letterSpacing: -0.02 * 12,
		color: Colors.POINTCOLOR,
	},

	// ── 공고 행 공통
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: vs(10),
		paddingHorizontal: s(15),
		borderRadius: ms(12),
		minHeight: vs(34),
	},
	rowNormal: {
		backgroundColor: '#FFFFFF',
	},
	rowActive: {
		backgroundColor: '#FFFFFF',
		minHeight: vs(48),
		paddingLeft: s(10),
	},
	rowMore: {
		backgroundColor: '#F3F0F5',
	},
	rowLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: s(10),
		flex: 1,
	},
	rowIcons: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: s(12),
		flexShrink: 0,
	},

	// ── 이전 공고 더보기
	rowMoreText: {
		fontFamily: 'Pretendard',
		fontWeight: '500',
		fontSize: ms(12),
		lineHeight: ms(14),
		letterSpacing: -0.02 * 12,
		color: Colors.POINTCOLOR,
	},

	// ── 현재 공고 배지
	badge: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: s(10),
		paddingVertical: vs(8),
		backgroundColor: Colors.POINTCOLOR,
		borderRadius: ms(12),
		width: ms(57),
		height: ms(28),
	},
	badgeText: {
		fontFamily: 'Pretendard',
		fontWeight: '600',
		fontSize: ms(10),
		lineHeight: ms(12),
		letterSpacing: -0.02 * 10,
		color: '#FFFFFF',
	},

	// ── 공고 제목 텍스트
	rowTextGray: {
		fontFamily: 'Pretendard',
		fontWeight: '500',
		fontSize: ms(12),
		lineHeight: ms(14),
		letterSpacing: -0.02 * 12,
		color: '#757474',
		flex: 1,
	},
	managerName: {
		fontFamily: 'Pretendard',
		fontWeight: '600',
		fontSize: ms(13),
		color: '#333',
		flex: 1,
	},
	managerStudentId: {
		fontFamily: 'Pretendard',
		fontWeight: '400',
		fontSize: ms(12),
		color: '#757474',
	},

	// ── 삭제 확인 모달
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalCard: {
		width: ms(320),
		backgroundColor: '#FFFFFF',
		borderRadius: ms(12),
		padding: ms(24),
		gap: ms(24),
		alignItems: 'center',
	},
	modalContents: {
		alignSelf: 'stretch',
		alignItems: 'center',
		gap: ms(8),
	},
	modalTitle: {
		fontFamily: 'Apple SD Gothic Neo',
		fontWeight: '700',
		fontSize: ms(16),
		lineHeight: ms(24),
		color: Colors.POINTCOLOR,
		textAlign: 'center',
		alignSelf: 'stretch',
	},
	modalDesc: {
		fontFamily: 'Apple SD Gothic Neo',
		fontWeight: '500',
		fontSize: ms(14),
		lineHeight: ms(24),
		color: '#000000',
		textAlign: 'center',
		alignSelf: 'stretch',
	},
	modalActions: {
		flexDirection: 'row',
		alignSelf: 'stretch',
		gap: ms(7),
	},
	modalCancelBtn: {
		width: ms(128),
		height: ms(44),
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
		borderRadius: ms(8),
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalCancelText: {
		fontFamily: 'Apple SD Gothic Neo',
		fontWeight: '700',
		fontSize: ms(16),
		lineHeight: ms(20),
		color: Colors.POINTCOLOR,
	},
	modalConfirmBtn: {
		width: ms(128),
		height: ms(44),
		backgroundColor: Colors.POINTCOLOR,
		borderRadius: ms(8),
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalTitleBlack: {
		color: '#000000',
	},
	modalConfirmText: {
		fontFamily: 'Apple SD Gothic Neo',
		fontWeight: '600',
		fontSize: ms(16),
		lineHeight: ms(20),
		color: '#FFFFFF',
	},
	modalSingleBtn: {
		alignSelf: 'stretch',
		height: ms(44),
		backgroundColor: Colors.POINTCOLOR,
		borderRadius: ms(8),
		justifyContent: 'center',
		alignItems: 'center',
	},
})
