import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'

type Props = {
	title: string
	onBack: () => void
}

const Header = ({ title, onBack }: Props) => {
	return (
		<View style={styles.container}>
			<Pressable style={styles.backButton} onPress={onBack}>
				<Icon name="chevron-left" size={ms(28)} color={Colors.BODYTEXT_SUB} />
			</Pressable>

			<View style={styles.titleWrapper}>
				<Text style={styles.title} numberOfLines={1}>
					{title}
				</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		height: vs(56),
		paddingHorizontal: s(16),
	},
	backButton: {
		position: 'absolute',
		left: s(16),
		top: 0,
		bottom: 0,
		justifyContent: 'center',
		width: ms(32),
		zIndex: 1,
	},
	titleWrapper: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		...typography.headerL,
		color: Colors.BODYTEXT_SUB,
	},
})

export default Header
