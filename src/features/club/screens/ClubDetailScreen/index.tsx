import { RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import { useProfile } from '@/shared/contexts/profileContext'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { ENV } from '@/config/ENV'
import { CategoryMap } from '@/shared/constants/category'
import { Club } from '@/entities/club'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import WithViewEventLog from '@/shared/hocs/WithViewEventLog'
import useClickEventLog from '@/shared/hooks/useClickEventLog'
import useRequireLogin from '@/shared/hooks/useRequireLogin'
import useSaveClub from '@/shared/hooks/useSaveClub'
import React, { useContext, useState } from 'react'
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Pressable,
	Share,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import Animated, {
	Extrapolation,
	interpolate,
	runOnJS,
	useAnimatedReaction,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import BackHeader from '@/shared/components/BackHeader'
import ReviewKeywordPill from '@/shared/components/ReviewKeywordPill'
import BackgroundCard from '@/features/club/components/ClubDetail/BackgroundCard'
import ClubDetailTabBar, {
	CLUB_DETAIL_TABS,
	ClubDetailTabKey,
} from '@/features/club/components/ClubDetail/ClubDetailTabBar'
import InfoTab from '@/features/club/components/ClubDetail/InfoTab'
import RecruitTab from '@/features/club/components/ClubDetail/RecruitTab'
import ReviewTab from '@/features/club/components/ClubDetail/ReviewTab'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'

type DetailsScreenRouteProp = RouteProp<StackParamList, SCREEN_TYPE.CLUB_DETAIL>
type DetailsScreenNavigationProp = NativeStackNavigationProp<
	StackParamList,
	SCREEN_TYPE.CLUB_DETAIL
>

type Props = {
	route: DetailsScreenRouteProp
	navigation: DetailsScreenNavigationProp
}

/**
 * ClubDetailScreen — 로고를 "배경"처럼 보여주는 상세 화면.
 *
 * 화면은 3겹으로 쌓여 있다(뒤 → 앞):
 *   1) ScrollView : 로고 → hero 카드 → 탭바 → 탭 콘텐츠 순으로 스크롤되는 본문.
 *                   화면 최상단(노치 아래)부터 시작하므로 윗부분이 헤더 뒤로 들어간다.
 *   2) 고정 탭바  : 스크롤이 충분히 내려가면 헤더 바로 아래에 나타나는 sticky 탭바.
 *   3) 헤더       : 항상 맨 앞에 떠 있는 BackHeader. 처음엔 배경이 투명해 뒤의 로고/hero가 비친다.
 *
 * 헤더가 본문을 "덮고"(투명) 있으므로 스크롤하면 헤더 뒤로 로고 → hero가 차례로 지나간다.
 * 본문이 헤더 뒤로 들어가는 만큼 헤더 배경을 서서히 채워 가독성을 확보하고,
 * 인플로우 탭바가 헤더에 닿는 순간 고정 탭바로 바꿔치기한다
 * (본문이 헤더 뒤로 들어가야 해서 ScrollView를 전체 화면에 깔았고, 그 탓에
 *  네이티브 stickyHeaderIndices는 헤더에 가려져 못 쓰기 때문).
 */

// HtmlView가 폭 측정 라운드트립(빈 프레임 → 내용 pop) 없이 첫 프레임부터 렌더하도록 미리 계산한다.
// tabContent 좌우 패딩 s(16) + 카드 패딩 s(16) 제외.
const HTML_CONTENT_WIDTH = Dimensions.get('window').width - s(16) * 4

const HEADER_HEIGHT = vs(56) // BackHeader 높이와 동일 (오버레이/고정 탭바 위치 계산에 사용)
const LOGO_BANNER_HEIGHT = vs(300) // 로고 배너(배경)의 높이
const LOGO_HERO_OVERLAP = vs(72) // hero 카드가 로고 하단을 덮고 올라오는 양

const ClubDetailScreen = ({ route, navigation }: Props) => {
	const {
		uuid,
		category: routeCategory,
		entry_point,
	} = route.params as DetailsScreenRouteProp['params']

	const { logClickEvent } = useClickEventLog()
	const { user } = useProfile()
	const requireLogin = useRequireLogin()
	const { data: club, isLoading } = useClub({ uuid })
	const { isSaved, handleToggle } = useSaveClub(club)

	const [activeTab, setActiveTab] = useState<ClubDetailTabKey>('detail')
	// 인플로우 탭바가 헤더 하단에 닿아 고정 탭바로 전환됐는지. 헤더 라벨 노출도 이 값으로 함께 제어한다.
	const [isTabBarPinned, setIsTabBarPinned] = useState(false)

	const insets = useSafeAreaInsets()

	// scrollY: 현재 스크롤 위치. tabBarOffset: 콘텐츠 안에서 인플로우 탭바가 놓인 y(아래 onLayout으로 측정).
	// tabBarOffset은 측정 전엔 매우 큰 값이라, 그 전까진 헤더가 투명하고 탭바도 고정되지 않는다.
	const scrollY = useSharedValue(0)
	const tabBarOffset = useSharedValue(Number.MAX_SAFE_INTEGER)
	const scrollHandler = useAnimatedScrollHandler(event => {
		scrollY.value = event.contentOffset.y
	})

	// 헤더 배경은 스크롤 시작(0)부터 "탭바 윗변이 헤더 아래에 닿는 지점(end)"까지 opacity 0→1로 서서히 채워진다.
	const headerBgStyle = useAnimatedStyle(() => {
		// 콘텐츠 내 탭바 위치에서 헤더 높이를 빼면, 탭바가 헤더 바로 아래에 닿는 스크롤 양이 된다.
		const end = tabBarOffset.value - HEADER_HEIGHT
		return {
			opacity: interpolate(scrollY.value, [0, end], [0, 1], Extrapolation.CLAMP),
		}
	})

	// 위 임계값(end)을 넘나드는 "순간"에만 React 상태를 토글한다(매 프레임 setState 방지).
	// 비교는 UI 스레드에서 하고, 값이 바뀔 때만 runOnJS로 JS 스레드의 setState를 호출한다.
	useAnimatedReaction(
		() => scrollY.value >= tabBarOffset.value - HEADER_HEIGHT,
		(pinned, wasPinned) => {
			if (pinned !== wasPinned) {
				runOnJS(setIsTabBarPinned)(pinned)
			}
		},
	)

	const currentCategory = routeCategory ?? club?.category

	if (isLoading && !currentCategory) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={Colors.POINTCOLOR} />
			</View>
		)
	}

	if (!currentCategory) return null
	const categoryDetail = CategoryMap[currentCategory]

	const handleBackButton = () => navigation.goBack()

	const handleWriteReview = () =>
		requireLogin(() =>
			navigation.navigate(SCREEN_TYPE.CLUB_REVIEW, { uuid, category: currentCategory }),
		)

	const handleShare = async () => {
		if (!club) return
		const shareUrl = `${ENV.WEB_URL}/club/${club.uuid}`
		try {
			await Share.share({
				message: `${club.name}의 동아리 정보를 확인해보세요!\n${shareUrl}`,
				url: shareUrl,
			})
		} catch (error) {
			console.error('Error occurred while sharing.', error)
		}
	}

	const handleLoginRequired = () => {
		logClickEvent({
			screen_name: 'club_detail_screen',
			screen_component_name: 'login_required_button',
		})
		requireLogin(() => {})
	}

	return (
		<WithViewEventLog
			params={{
				screen_name: 'club_detail_screen',
				category: currentCategory,
				club_name: club?.name ?? '',
				entry_point: entry_point ?? '',
			}}>
			<SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
				{isLoading && (
					<ActivityIndicator size="large" color={categoryDetail.themeColor} style={styles.loader} />
				)}
				{club && (
					// 본문: 화면 전체에 깔려 헤더 뒤까지 스크롤된다(헤더가 투명할 때 뒤로 비치게 하기 위함).
					<Animated.ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.contentContainer}
						showsVerticalScrollIndicator={false}
						onScroll={scrollHandler}
						scrollEventThrottle={16}>
						{/* 로고 배경: 본문의 첫 블록. 투명한 헤더 뒤로 비치며, 상/하단을 페이지 배경색으로 fade 처리한다. */}
						<View style={styles.logoBanner}>
							<Image style={styles.logoImage} source={{ uri: club.imageUri }} resizeMode="cover" />
							{/* 로고 오버레이: 상/하단은 배경색(#FAFAFA)으로 완전히 덮고, 중앙은 30% 베일을 깔아 로고 색을 살짝 눌러 준다. */}
							<LinearGradient
								pointerEvents="none"
								colors={[
									Colors.BACKGROUND_MAIN,
									'rgba(250, 250, 250, 0.3)',
									'rgba(250, 250, 250, 0.3)',
									Colors.BACKGROUND_MAIN,
								]}
								locations={[0.0295, 0.399, 0.606, 0.8372]}
								start={{ x: 0, y: 0 }}
								end={{ x: 0, y: 1 }}
								style={styles.logoFade}
							/>
						</View>

						{/* Hero 카드: marginTop 음수(styles.card)로 로고 하단을 LOGO_HERO_OVERLAP만큼 덮고 올라온다. */}
						<BackgroundCard style={styles.card}>
							<View style={styles.cardHeader}>
								<View style={styles.cardTitleRow}>
									<Text style={styles.clubName} numberOfLines={1}>
										{club.name}
									</Text>
								</View>
								<View style={styles.headerActions}>
									<Pressable
										onPress={handleToggle}
										hitSlop={8}
										style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
										<Image
											source={
												isSaved
													? require('@/assets/icons/heart-fill.png')
													: require('@/assets/icons/heart.png')
											}
											style={styles.savedIcon}
											resizeMode="contain"
										/>
									</Pressable>
									<Pressable
										onPress={handleShare}
										hitSlop={8}
										style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
										<Icon name="share-variant" size={ms(22)} color={Colors.POINTCOLOR} />
									</Pressable>
								</View>
							</View>
							<Text style={styles.description}>{club.description}</Text>
							{club.reviewKeywords.length > 0 && (
								<View style={styles.keywordRow}>
									{club.reviewKeywords.slice(0, 2).map(keyword => (
										<ReviewKeywordPill
											key={keyword.id}
											keyword={keyword}
											themeColor={categoryDetail.themeColor}
											backgroundColor={categoryDetail.backgroundColor}
										/>
									))}
								</View>
							)}
						</BackgroundCard>

						{/* 인플로우 탭바: 본문과 함께 스크롤된다. onLayout으로 콘텐츠 내 위치(y)를 재서 고정 전환 시점 계산에 쓴다. */}
						<View
							onLayout={event => {
								tabBarOffset.value = event.nativeEvent.layout.y
							}}>
							<ClubDetailTabBar activeKey={activeTab} onChange={setActiveTab} />
						</View>

						{/* Tab Content */}
						<View style={styles.tabContent}>
							{activeTab === 'detail' && <InfoTab club={club} contentWidth={HTML_CONTENT_WIDTH} />}

							{activeTab === 'recruit' && (
								<RecruitTab
									club={club}
									tabLabel={CLUB_DETAIL_TABS[activeTab]}
									contentWidth={HTML_CONTENT_WIDTH}
									isLoggedIn={!!user}
									onLoginPress={handleLoginRequired}
								/>
							)}

							{activeTab === 'review' && (
								<ReviewTab
									club={club}
									tabLabel={CLUB_DETAIL_TABS[activeTab]}
									categoryDetail={categoryDetail}
									isLoggedIn={!!user}
									onLoginPress={handleLoginRequired}
									onWriteReview={handleWriteReview}
								/>
							)}
						</View>
					</Animated.ScrollView>
				)}

				{/* 고정 탭바: 스크롤이 임계값을 넘으면 헤더 바로 아래(top: insets.top + HEADER_HEIGHT)에 표시한다.
				    인플로우 탭바는 이때 헤더 뒤로 올라가 안 보이므로, 같은 탭바를 여기 한 번 더 그려 sticky처럼 보이게 한다. */}
				{club && isTabBarPinned && (
					<View style={[styles.pinnedTabBar, { top: insets.top + HEADER_HEIGHT }]}>
						<ClubDetailTabBar activeKey={activeTab} onChange={setActiveTab} />
					</View>
				)}

				{/* 헤더(오버레이): 본문 위에 항상 떠 있다. 절대배치는 SafeAreaView의 top 패딩을 무시하므로
				    top을 insets.top으로 직접 줘 노치 아래에 맞춘다. box-none이라 빈 영역 터치는 통과하고 뒤로가기 버튼만 받는다. */}
				<View style={[styles.headerOverlay, { top: insets.top }]} pointerEvents="box-none">
					{/* 배경판: 스크롤에 따라 opacity 0→1로 채워진다. */}
					<Animated.View
						style={[StyleSheet.absoluteFill, styles.headerBg, headerBgStyle]}
						pointerEvents="none"
					/>
					{/* 뒤로가기 버튼은 항상 불투명하게 둔다. 라벨만 배경이 완전히 불투명해지는(=고정되는) 시점에 노출한다. */}
					<BackHeader title={isTabBarPinned ? (club?.name ?? '') : ''} onBack={handleBackButton} />
				</View>
			</SafeAreaView>
		</WithViewEventLog>
	)
}

export default ClubDetailScreen

type UseClubProps = {
	uuid: Club['uuid']
}

const useClub = ({ uuid }: UseClubProps) => {
	const { clubService } = useContext(serviceContext)
	return useQuery(['clubs', uuid], () => clubService.getClub({ uuid }))
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_MAIN,
	},
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.BACKGROUND_MAIN,
	},
	loader: {
		flex: 1,
	},
	// 투명하게 둬야 헤더 뒤로 본문(로고/hero)이 비치고, 빈 곳엔 SafeAreaView 배경색이 보인다.
	scrollView: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	contentContainer: {
		paddingBottom: vs(40),
	},
	logoBanner: {
		height: LOGO_BANNER_HEIGHT,
		overflow: 'hidden', // cover 이미지가 배너 밖으로 넘치지 않도록
	},
	logoImage: {
		width: '100%',
		height: '100%',
	},
	logoFade: {
		...StyleSheet.absoluteFillObject,
	},
	// top은 노치 인셋(insets.top)을 런타임에 인라인으로 더해 준다.
	headerOverlay: {
		position: 'absolute',
		left: 0,
		right: 0,
	},
	headerBg: {
		backgroundColor: Colors.BACKGROUND_MAIN,
	},
	// top은 insets.top + HEADER_HEIGHT를 런타임에 인라인으로 준다(헤더 바로 아래).
	pinnedTabBar: {
		position: 'absolute',
		left: 0,
		right: 0,
	},
	card: {
		marginTop: -LOGO_HERO_OVERLAP, // 로고 하단을 덮으며 올라오게(overlap)
		marginHorizontal: s(16),
		marginBottom: vs(12),
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: vs(6),
	},
	cardTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flexShrink: 1,
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: ms(12),
	},
	savedIcon: {
		width: ms(22),
		height: ms(22),
	},
	clubName: {
		...typography.headerXL,
		color: Colors.BODYTEXT_MAIN,
		flexShrink: 1,
	},
	description: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		marginBottom: vs(10),
	},
	keywordRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: ms(4),
	},
	tabContent: {
		paddingHorizontal: s(16),
	},
})
