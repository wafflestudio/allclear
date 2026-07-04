import React, { useCallback, useState } from 'react'
import { Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { Club } from '@/entities/club'
import HtmlView from '@/shared/components/HtmlView'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'
import BackgroundCard from './BackgroundCard'

type Props = {
	club: Club
	contentWidth: number
}

const COLLAPSED_MAX_HEIGHT = vs(115) // 약 6줄
const FADE_COLORS = ['rgba(255, 255, 255, 0)', Colors.WHITE]
const ICON_SIZE = 30

const InfoTab = ({ club, contentWidth }: Props) => {
	const [descriptionExpanded, setDescriptionExpanded] = useState(false)
	const [contentHeight, setContentHeight] = useState<number | null>(null)

	// 접힘 판단에 쓸 전체 높이. 재레이아웃 시 더 작은 값으로 덮어쓰지 않도록 관측된 최대값을 유지한다.
	const onContentLayout = useCallback((e: LayoutChangeEvent) => {
		const height = e.nativeEvent.layout.height
		setContentHeight(prev => (prev === null || height > prev ? height : prev))
	}, [])

	const isLong = contentHeight !== null && contentHeight > COLLAPSED_MAX_HEIGHT
	const collapsed = !descriptionExpanded && (contentHeight === null || isLong) // contentHeight 초기화 전에는 접힌 상태

	const iconItems = [
		{
			label: '분류',
			value: `${club.type} 동아리`,
			icon: require('@/assets/icons/clubInfo/club-type.png'),
		},
		{
			label: '단과대학',
			value: club.college,
			icon: require('@/assets/icons/clubInfo/college.png'),
		},
		{
			label: '모집형태',
			value: `${club.recruitType} 모집`,
			icon: require('@/assets/icons/clubInfo/recruit-type.png'),
		},
	].filter(item => !!item.value?.trim())

	const detailRows: { label: string; value: string }[] = [
		{ label: '활동주기', value: club.activityCycle },
		{ label: '회비', value: club.membershipFee },
	].filter(row => !!row.value?.trim())

	const introduction = club.introduction?.trim()

	if (!introduction && iconItems.length === 0 && detailRows.length === 0) {
		return (
			<View style={styles.emptyState}>
				<Text style={styles.emptyText}>아직 등록된 상세정보가 없어요.</Text>
			</View>
		)
	}

	return (
		<BackgroundCard style={styles.card}>
			<View style={styles.sections}>
				{iconItems.length > 0 && (
					<View style={styles.iconRow}>
						{iconItems.map((item, index) => (
							<React.Fragment key={item.label}>
								{index > 0 && <View style={styles.iconDivider} />}
								<View style={styles.iconCell}>
									<Image source={item.icon} style={styles.icon} resizeMode="contain" />
									<Text style={styles.iconValue}>{item.value}</Text>
								</View>
							</React.Fragment>
						))}
					</View>
				)}

				{introduction && (
					<View style={styles.descriptionSection}>
						<Text style={styles.label}>상세설명</Text>
						<View>
							<View style={collapsed && styles.descriptionCollapsed}>
								<View onLayout={onContentLayout}>
									<HtmlView html={introduction} contentWidth={contentWidth} />
								</View>
							</View>
							{collapsed && isLong && (
								<LinearGradient pointerEvents="none" colors={FADE_COLORS} style={styles.fade} />
							)}
						</View>
						{isLong && (
							<Pressable
								style={styles.toggle}
								hitSlop={8}
								onPress={() => setDescriptionExpanded(prev => !prev)}>
								<Icon
									name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
									size={ms(24)}
									color={Colors.BODYTEXT_SUB}
								/>
							</Pressable>
						)}
					</View>
				)}

				{detailRows.length > 0 && (
					<View style={styles.infoList}>
						{detailRows.map(row => (
							<View key={row.label} style={styles.infoRow}>
								<Text style={[styles.label, styles.labelColumn]}>{row.label}</Text>
								<Text style={styles.infoValue}>{row.value}</Text>
							</View>
						))}
					</View>
				)}
			</View>
		</BackgroundCard>
	)
}

export default InfoTab

const styles = StyleSheet.create({
	card: {
		marginTop: vs(16),
	},
	sections: {
		gap: vs(20),
	},
	label: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB_2,
	},
	labelColumn: {
		width: s(76),
	},
	iconRow: {
		flexDirection: 'row',
	},
	iconCell: {
		flex: 1,
		alignItems: 'center',
		gap: vs(8),
	},
	iconDivider: {
		width: 1,
		backgroundColor: Colors.TEXTBOX_SELECTED,
	},
	icon: {
		width: ICON_SIZE,
		height: ICON_SIZE,
	},
	iconValue: {
		...typography.bodyMMedium,
		color: Colors.BODYTEXT_SUB,
	},
	descriptionSection: {
		gap: vs(8),
	},
	descriptionCollapsed: {
		maxHeight: COLLAPSED_MAX_HEIGHT,
		overflow: 'hidden',
	},
	fade: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		height: vs(28),
	},
	toggle: {
		alignItems: 'center',
		marginTop: -vs(8),
	},
	infoList: {
		gap: vs(12),
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	infoValue: {
		...typography.bodyMMedium,
		color: Colors.BODYTEXT_SUB,
		flex: 1,
	},
	emptyState: {
		minHeight: vs(160),
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyText: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
		textAlign: 'center',
	},
})
