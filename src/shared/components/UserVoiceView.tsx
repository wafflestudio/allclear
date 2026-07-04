import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { serviceContext } from '@/shared/contexts/serviceContext'
import React, { useContext } from 'react'
import { Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'

type Props = {
	closeBottomSheet: () => void
}

const UserVoiceView = ({ closeBottomSheet }: Props) => {
	const [input, setInput] = React.useState('')
	const { userService } = useContext(serviceContext)

	const handleSubmit = async () => {
		try {
			Keyboard.dismiss()
			closeBottomSheet()
			await userService.createUserVoice({ content: input })

			setTimeout(() => {
				Toast.show({
					type: 'info',
					text1: '의견이 전송되었어요!',
					position: 'bottom',
					visibilityTime: 2000,
				})
			}, 1000)

			setInput('')
		} catch {
			Toast.show({
				type: 'info',
				text1: `이런! 문제가 생겼어요!`,
				position: 'bottom',
				visibilityTime: 2000,
			})
		}
	}

	return (
		<View style={styles.mainWrapper}>
			<View style={styles.titleWrapper}>
				<View>
					<Text style={[styles.title, styles.bold]}>여러분의 의견이 필요해요!</Text>
					<Text style={styles.title}>올클에 건의사항이 있다면 자유롭게 알려주세요😊</Text>
				</View>
			</View>
			<View>
				<View style={styles.inputWrapper}>
					<BottomSheetTextInput
						value={input}
						onChangeText={setInput}
						multiline
						numberOfLines={4}
						maxLength={1000}
						style={styles.input}
						placeholder="여기에 의견을 적어주세요. (1000자 이내)"
					/>
				</View>
			</View>
			<View style={styles.buttonWrapper}>
				<TouchableOpacity
					disabled={!input}
					onPress={handleSubmit}
					style={[
						styles.button,
						{ backgroundColor: '#3A3434' /* #deprecated color */, marginTop: 'auto' },
					]}>
					<Text
						style={{
							color: '#FFFFFF', // #deprecated color
							fontSize: 16,
							textAlign: 'center',
							fontWeight: 'bold',
						}}>
						의견 보내기
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

export default UserVoiceView

const styles = StyleSheet.create({
	mainWrapper: {
		display: 'flex',
		paddingVertical: 32,
		paddingHorizontal: 24,
		backgroundColor: 'white',
	},

	titleWrapper: {
		display: 'flex',
		flex: 0,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},

	title: {
		fontSize: 16,
		lineHeight: 24,
	},

	bold: {
		fontWeight: 'bold',
	},

	inputWrapper: {},

	input: {
		height: '100%',
		maxHeight: 120,
		backgroundColor: '#FFFFFF', // #deprecated color
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 12,
		fontSize: 16,
		color: '#3A3434', // #deprecated color
		textAlignVertical: 'top',
	},

	buttonWrapper: {
		marginTop: 'auto',
		bottom: 0,
		width: '100%',
		left: 0,
		right: 0,
	},

	button: {
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
	},
})
