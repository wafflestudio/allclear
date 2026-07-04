import { useLoginBottomSheet } from '@/shared/contexts/loginBottomSheetContext'
import { useProfile } from '@/shared/contexts/profileContext'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const HeaderProfile = () => {
	const { user } = useProfile()

	const { openBottomSheet } = useLoginBottomSheet()

	return (
		<View>
			{user ? (
				<View style={styles.nicknameContainer}>
					<Text style={styles.nickname}>{user.nickname?.charAt(0) ?? 'U'}</Text>
				</View>
			) : (
				<TouchableOpacity onPress={() => openBottomSheet()}>
					<View>
						<Image style={styles.defaultImage} source={require('@/assets/images/default-me.png')} />
					</View>
				</TouchableOpacity>
			)}
		</View>
	)
}

export default HeaderProfile

const styles = StyleSheet.create({
	nicknameContainer: {
		width: 24,
		height: 24,
		borderRadius: 16,
		backgroundColor: 'rgba(0, 0, 0, 0.20)',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},
	nickname: {
		fontSize: 12,
		fontWeight: 'bold',
		color: 'white',
		textAlign: 'center',
	},
	defaultImage: {
		width: 24,
		height: 24,
		borderRadius: 16,
		backgroundColor: 'rgba(0, 0, 0, 0.20)',
	},
})
