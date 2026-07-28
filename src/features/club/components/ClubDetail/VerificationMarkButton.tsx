import React from 'react'
import { Image, ImageSourcePropType, Pressable, StyleSheet } from 'react-native'

import { OfficialVerificationStatus } from '@/entities/club'
import { ms } from '@/shared/utils/scale'

type Props = {
	status?: OfficialVerificationStatus
	onPress: () => void
}

const MARK_SOURCE_BY_STATUS: Partial<Record<OfficialVerificationStatus, ImageSourcePropType>> = {
	VERIFIED: require('@/assets/icons/clubInfo/verification-mark.png'),
	PENDING: require('@/assets/icons/clubInfo/verification-pending-mark.png'),
}

const VerificationMarkButton = ({ status, onPress }: Props) => {
	const markSource = status ? MARK_SOURCE_BY_STATUS[status] : undefined

	if (!markSource || status === 'UNVERIFIED') return null

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="동아리 인증 상태 안내"
			onPress={onPress}
			hitSlop={8}
			style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
			<Image source={markSource} style={styles.mark} resizeMode="contain" />
		</Pressable>
	)
}

export default VerificationMarkButton

const styles = StyleSheet.create({
	button: {
		width: ms(20),
		height: ms(20),
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},
	pressed: {
		opacity: 0.5,
	},
	mark: {
		width: ms(20),
		height: ms(20),
	},
})
