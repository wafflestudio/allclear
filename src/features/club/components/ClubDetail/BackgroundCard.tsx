import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

import { Colors } from '@/shared/constants/colors'
import { ms, s } from '@/shared/utils/scale'

type Props = {
	children: React.ReactNode
	style?: StyleProp<ViewStyle>
}

const BackgroundCard = ({ children, style }: Props) => {
	return <View style={[styles.card, style]}>{children}</View>
}

export default BackgroundCard

const styles = StyleSheet.create({
	card: {
		backgroundColor: Colors.WHITE, // android에서 shadow가 보이도록 배경색 설정 필수
		borderRadius: ms(16),
		padding: s(16),
		shadowColor: Colors.BLACK,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 1,
	},
})
