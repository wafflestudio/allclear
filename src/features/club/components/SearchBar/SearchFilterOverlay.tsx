import { Pressable, StyleSheet, Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import {
	SearchFilterToggleGroup,
	type SearchFilterToggleGroupSelection,
} from '@/features/club/components/SearchFilterToggleGroup'
import { MinDurationToggle } from '@/features/club/components/MinDurationToggle/MinDurationToggle'
import {
	normalizeClubSearchFilters,
	type ClubSearchFilters,
} from '@/features/search/types/clubSearchForm'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { s } from '@/shared/utils/scale'

type Props = {
	value: ClubSearchFilters
	onChange: (value: ClubSearchFilters) => void
	onReset: () => void
	onClose: () => void
}

const RECRUITMENT_OPTIONS = [
	{ label: '정기모집', value: '정기' },
	{ label: '상시모집', value: '상시' },
] as const

const ROOM_OPTIONS = [{ label: '동방보유', value: 'true' }] as const

const FEE_OPTIONS = [{ label: '회비없음', value: 'false' }] as const

const toSingleSelection = (value?: string): SearchFilterToggleGroupSelection =>
	value ? { kind: 'values', values: [value] } : { kind: 'none' }

const getSingleSelectionValue = (
	selection: SearchFilterToggleGroupSelection,
): string | undefined => {
	if (selection.kind !== 'values') {
		return undefined
	}

	return selection.values[0]
}

const SearchFilterOverlay = ({ value, onChange, onReset, onClose }: Props) => {
	const normalizedValue = normalizeClubSearchFilters(value)
	const recruitmentSelection = toSingleSelection(normalizedValue.recruit_type)
	const feeSelection = toSingleSelection(normalizedValue.has_membership_fee)
	const roomSelection = toSingleSelection(normalizedValue.has_dongbang)

	const handleChangeRecruitType = (selection: SearchFilterToggleGroupSelection) => {
		onChange({
			...normalizedValue,
			recruit_type: getSingleSelectionValue(selection) as ClubSearchFilters['recruit_type'],
		})
	}

	const handleChangeMembershipFee = (selection: SearchFilterToggleGroupSelection) => {
		onChange({
			...normalizedValue,
			has_membership_fee: getSingleSelectionValue(
				selection,
			) as ClubSearchFilters['has_membership_fee'],
		})
	}

	const handleChangeDongbang = (selection: SearchFilterToggleGroupSelection) => {
		onChange({
			...normalizedValue,
			has_dongbang: getSingleSelectionValue(selection) as ClubSearchFilters['has_dongbang'],
		})
	}

	return (
		<View style={styles.wrapper}>
			<Pressable onPress={onClose} style={styles.dim} />
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.text}>더 자세한 검색을 위해 상세필터를 설정해보세요!</Text>
					<Pressable
						hitSlop={8}
						onPress={onReset}
						style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
						<Icon color={Colors.POINTCOLOR} name="reload" size={s(15)} />
					</Pressable>
				</View>
				<View style={styles.filters}>
					<View style={styles.filterRow}>
						<SearchFilterToggleGroup
							options={[...RECRUITMENT_OPTIONS]}
							selectionMode="single"
							value={recruitmentSelection}
							onChange={handleChangeRecruitType}
						/>
						<SearchFilterToggleGroup
							options={[...ROOM_OPTIONS]}
							selectionMode="single"
							value={roomSelection}
							onChange={handleChangeDongbang}
						/>
						<SearchFilterToggleGroup
							options={[...FEE_OPTIONS]}
							selectionMode="single"
							value={feeSelection}
							onChange={handleChangeMembershipFee}
						/>
					</View>
					<MinDurationToggle
						value={normalizedValue.min_activity_period}
						onChange={min_activity_period =>
							onChange({
								...normalizedValue,
								min_activity_period,
							})
						}
					/>
				</View>
			</View>
		</View>
	)
}

export default SearchFilterOverlay

const styles = StyleSheet.create({
	wrapper: {
		...StyleSheet.absoluteFillObject,
		zIndex: 10,
	},
	dim: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: Colors.BACKGROUND_DIM,
	},
	container: {
		backgroundColor: Colors.BACKGROUND_MAIN,
		borderBottomLeftRadius: s(15),
		borderBottomRightRadius: s(15),
		paddingTop: s(27),
		paddingRight: s(20),
		paddingBottom: s(31),
		paddingLeft: s(34),
		gap: s(18),
		shadowColor: '#000000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
		zIndex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	filters: {
		gap: s(20),
	},
	filterRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: s(15),
	},
	text: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
		flex: 1,
	},
	resetButton: {
		marginLeft: s(16),
		alignItems: 'center',
		justifyContent: 'center',
	},
	pressed: {
		opacity: 0.65,
	},
})
