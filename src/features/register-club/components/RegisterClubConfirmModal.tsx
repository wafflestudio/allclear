import React from 'react'
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { s, vs } from '@/shared/utils/scale'

type Props = {
	visible: boolean
	clubName: string
	isLoading?: boolean
	onCancel: () => void
	onConfirm: () => void
}

export const RegisterClubConfirmModal = ({
	visible,
	clubName,
	isLoading = false,
	onCancel,
	onConfirm,
}: Props) => {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
			<View style={styles.backdrop}>
				<View style={styles.card}>
					<Text style={styles.title}>{clubName}의 동아리 등록을 요청할까요?</Text>
					<Text style={styles.message}>
						등록 요청 후 승인까지는{'\n'}최대 일주일이 소요될 수 있어요
					</Text>

					<View style={styles.buttonRow}>
						<Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
							<Text style={styles.cancelText}>취소</Text>
						</Pressable>
						<Pressable
							style={({ pressed }) => [
								styles.button,
								styles.confirmButton,
								pressed && !isLoading && styles.confirmButtonPressed,
							]}
							onPress={onConfirm}
							disabled={isLoading}>
							<Text style={styles.confirmText}>요청</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_DIM,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: s(20),
	},
	card: {
		width: '100%',
		backgroundColor: Colors.WHITE,
		borderRadius: s(20),
		paddingHorizontal: s(20),
		paddingVertical: vs(28),
		alignItems: 'center',
	},
	title: {
		...typography.headerL,
		color: Colors.BODYTEXT_MAIN,
		textAlign: 'center',
	},
	message: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		textAlign: 'center',
		marginTop: vs(12),
		lineHeight: vs(22),
	},
	buttonRow: {
		flexDirection: 'row',
		gap: s(12),
		marginTop: vs(24),
	},
	button: {
		flex: 1,
		paddingVertical: vs(14),
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cancelButton: {
		borderWidth: 1,
		borderColor: Colors.BUTTON_SELECTED,
		backgroundColor: Colors.WHITE,
	},
	cancelText: {
		...typography.headerL,
		color: Colors.BUTTON_SELECTED,
	},
	confirmButton: {
		backgroundColor: Colors.BUTTON_SELECTED,
	},
	confirmButtonPressed: {
		backgroundColor: Colors.BUTTON_PUSH,
	},
	confirmText: {
		...typography.headerL,
		color: Colors.TEXT_BUTTON_SELECTED,
	},
})
