import React, { useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'

import { getClubManagementEditButtonColors } from '@/features/club/utils/clubManagementEditButton'
import { ms } from '@/shared/utils/scale'

const editPencilIcon = require('@/assets/icons/club-edit-pencil.png') as number

type ClubManagementEditButtonProps = {
	onPress: () => void
}

export const ClubManagementEditButton = ({ onPress }: ClubManagementEditButtonProps) => {
	const [hovered, setHovered] = useState(false)

	return (
		<Pressable
			accessibilityLabel="동아리 정보 수정"
			accessibilityRole="button"
			hitSlop={8}
			onHoverIn={() => setHovered(true)}
			onHoverOut={() => setHovered(false)}
			onPress={onPress}
			style={({ pressed }) => [
				styles.button,
				{
					backgroundColor: getClubManagementEditButtonColors({ hovered, pressed }).backgroundColor,
				},
			]}>
			{({ pressed }) => (
				<Image
					source={editPencilIcon}
					style={[
						styles.icon,
						{
							tintColor: getClubManagementEditButtonColors({ hovered, pressed }).iconColor,
						},
					]}
				/>
			)}
		</Pressable>
	)
}

const styles = StyleSheet.create({
	button: {
		width: ms(28),
		height: ms(28),
		borderRadius: ms(14),
		alignItems: 'center',
		justifyContent: 'center',
	},
	icon: {
		width: ms(14),
		height: ms(14),
		resizeMode: 'contain',
	},
})
