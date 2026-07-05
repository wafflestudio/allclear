import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Colors } from '@/shared/constants/colors'
import { ms, s, vs } from '@/shared/utils/scale'
import { navigation } from '@/shared/utils/navigation'

const ClubInfoEditScreen = () => {
	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
			<View style={styles.header}>
				<Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
					<Icon name="chevron-left" size={ms(24)} color={Colors.BODYTEXT_SUB} />
				</Pressable>
				<Text style={styles.headerTitle}>동아리 정보 수정</Text>
			</View>
			<View style={styles.content} />
		</SafeAreaView>
	)
}

export default ClubInfoEditScreen

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.WHITE,
	},
	header: {
		height: vs(39),
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.WHITE,
	},
	backBtn: {
		position: 'absolute',
		left: s(20),
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
		color: Colors.BODYTEXT_SUB,
	},
	content: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_SUB,
	},
})
