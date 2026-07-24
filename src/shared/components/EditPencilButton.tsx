import React, { useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'

import { getEditPencilButtonColors } from '@/shared/utils/editPencilButton'
import { ms } from '@/shared/utils/scale'

const editPencilIcon = require('@/assets/icons/club-edit-pencil.png') as number

type EditPencilButtonProps = {
	accessibilityLabel: string
	onPress: () => void
}

const EditPencilButton = ({ accessibilityLabel, onPress }: EditPencilButtonProps) => {
	const [hovered, setHovered] = useState(false)

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			hitSlop={8}
			onHoverIn={() => setHovered(true)}
			onHoverOut={() => setHovered(false)}
			onPress={onPress}
			style={({ pressed }) => [
				styles.button,
				{
					backgroundColor: getEditPencilButtonColors({ hovered, pressed }).backgroundColor,
				},
			]}>
			{({ pressed }) => (
				<Image
					source={editPencilIcon}
					style={[
						styles.icon,
						{
							tintColor: getEditPencilButtonColors({ hovered, pressed }).iconColor,
						},
					]}
				/>
			)}
		</Pressable>
	)
}

export default EditPencilButton

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
