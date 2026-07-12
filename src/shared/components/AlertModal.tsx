import { Modal, Pressable, View, StyleSheet, Text } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { Colors } from '@/shared/constants/colors'
import Button, { type ButtonVariant } from '@/shared/components/Button'

export type AlertModalProps = {
	visible: boolean
	onClose: () => void
	title: string
	description?: string
	buttonLabel: string
	onButtonPress: () => void
	buttonVariant?: ButtonVariant
	hasCancel?: boolean
	cancelLabel?: string
	dismissOnBackdropPress?: boolean
	overlayColor?: string
	blurAmount?: number
}

const AlertModal = ({
	visible,
	onClose,
	title,
	description,
	buttonLabel,
	onButtonPress,
	buttonVariant = 'primary',
	hasCancel = false,
	cancelLabel = '취소',
	dismissOnBackdropPress = true,
	overlayColor = Colors.BACKGROUND_DIM,
	blurAmount = 1,
}: AlertModalProps) => {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<Pressable
				style={[styles.overlay, { backgroundColor: overlayColor }]}
				onPress={dismissOnBackdropPress ? onClose : undefined}>
				<BlurView
					style={styles.blur}
					blurType="light"
					blurAmount={blurAmount}
					overlayColor="transparent"
					reducedTransparencyFallbackColor="transparent"
				/>
				<Pressable style={styles.container} onPress={e => e.stopPropagation()}>
					<Text style={styles.title}>{title}</Text>
					{description ? <Text style={styles.description}>{description}</Text> : null}
					<View style={styles.buttonArea}>
						{hasCancel && (
							<Button
								label={cancelLabel}
								onPress={onClose}
								variant="outline"
								style={styles.button}
							/>
						)}
						<Button
							label={buttonLabel}
							onPress={onButtonPress}
							variant={buttonVariant}
							style={styles.button}
						/>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	blur: {
		...StyleSheet.absoluteFillObject,
	},
	container: {
		width: '100%',
		backgroundColor: Colors.WHITE,
		borderRadius: 16,
		padding: 24,
	},
	title: {
		fontSize: 18,
		fontWeight: '700',
		color: Colors.BLACK,
		textAlign: 'center',
	},
	description: {
		fontSize: 14,
		fontWeight: '400',
		color: Colors.BLACK,
		textAlign: 'center',
		marginTop: 12,
	},
	buttonArea: {
		flexDirection: 'row',
		gap: 8,
		marginTop: 24,
	},
	button: {
		paddingHorizontal: 16,
	},
})

export default AlertModal
