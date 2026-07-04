import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'

type Props = {
	correctedQuery: string
	onClose?: () => void
}

const TypoCorrectionNotice = ({ correctedQuery, onClose }: Props) => {
	return (
		<View style={styles.container}>
			<View style={styles.messageGroup}>
				<View style={styles.iconCircle}>
					<Icon name="auto-fix" size={ms(18)} color={Colors.POINTCOLOR} />
				</View>
				<View>
					<Text style={styles.message}>올클이 오타를 감지했어요!</Text>
					<Text style={styles.message}>
						유사 검색어 ‘<Text style={styles.highlight}>{correctedQuery}</Text>’로 검색한 결과예요
					</Text>
				</View>
			</View>
			{onClose ? (
				<Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
					<Icon name="close" size={ms(12)} color={Colors.WHITE} />
				</Pressable>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: s(17),
		paddingVertical: vs(13),
		borderRadius: ms(10),
		backgroundColor: 'rgba(243, 240, 245, 0.5)',
	},
	messageGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: s(8),
		flex: 1,
	},
	iconCircle: {
		width: ms(34),
		height: ms(34),
		borderRadius: ms(17),
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.WHITE,
	},
	message: {
		...typography.bodySMedium,
		lineHeight: vs(17),
		color: Colors.BODYTEXT_SUB,
	},
	highlight: {
		color: Colors.POINTCOLOR,
	},
	closeButton: {
		width: ms(16),
		height: ms(16),
		borderRadius: ms(8),
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.BODYTEXT_DISABLED,
		marginLeft: s(12),
	},
})

export default TypoCorrectionNotice
