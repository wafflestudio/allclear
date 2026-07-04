import { useEffect, useState } from 'react'
import { BlurView } from '@react-native-community/blur'
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Button from '@/shared/components/Button'
import Checkbox from '@/shared/components/Checkbox'
import { Colors } from '@/shared/constants/colors'
import { useProfile } from '@/shared/contexts/profileContext'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
	visible: boolean
	announcementUuid: string
	title: string
	description: string
	onHide: () => void
	onClose: () => void
}

const AnnouncementModal = ({
	visible,
	announcementUuid,
	title,
	description,
	onHide,
	onClose,
}: Props) => {
	const { height: windowHeight } = useWindowDimensions()
	const insets = useSafeAreaInsets()
	const { user } = useProfile()
	const showHideOption = !!user
	const [hideChecked, setHideChecked] = useState(false)

	const modalHeight = Math.min(vs(500), windowHeight - insets.top - insets.bottom - vs(40))

	useEffect(() => {
		setHideChecked(false)
	}, [announcementUuid])

	const handleDismiss = () => {
		if (showHideOption && hideChecked) {
			onHide()
			return
		}

		onClose()
	}

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<Pressable style={styles.backdrop} onPress={handleDismiss}>
					<BlurView
						style={styles.blur}
						blurType="light"
						blurAmount={1}
						overlayColor="transparent"
						reducedTransparencyFallbackColor="transparent"
					/>
				</Pressable>
				<View style={[styles.container, { height: modalHeight }]}>
					<View style={styles.headerSection}>
						<View style={styles.header}>
							<View style={styles.badge}>
								<Text style={styles.badgeText}>공지</Text>
							</View>
							<Pressable style={styles.closeButton} hitSlop={8} onPress={handleDismiss}>
								<Icon name="close" size={ms(22)} color={Colors.BODYTEXT_SUB} />
							</Pressable>
						</View>
						<Text style={styles.title}>{title}</Text>
					</View>
					<View style={styles.bodySection}>
						<ScrollView
							style={styles.descriptionScroll}
							showsVerticalScrollIndicator={true}
							bounces={false}
							contentContainerStyle={styles.descriptionContent}>
							<Text style={styles.description}>{description}</Text>
						</ScrollView>
					</View>
					<View style={styles.footer}>
						{showHideOption && (
							<Checkbox
								label="다시 보지 않기"
								checked={hideChecked}
								onPressIn={() => setHideChecked(prev => !prev)}
								style={styles.checkbox}
								textStyle={styles.checkboxLabel}
							/>
						)}
						<View style={styles.buttonWrapper}>
							<Button label="확인" onPress={handleDismiss} width={s(188)} style={styles.button} />
						</View>
					</View>
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: s(20),
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: Colors.BACKGROUND_DIM,
	},
	blur: {
		...StyleSheet.absoluteFillObject,
	},
	container: {
		width: '100%',
		backgroundColor: Colors.POINTCOLOR_SUB,
		borderRadius: ms(28),
		paddingHorizontal: s(24),
		paddingTop: vs(20),
		paddingBottom: vs(24),
	},
	headerSection: {
		gap: vs(18),
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	badge: {
		backgroundColor: Colors.POINTCOLOR_10,
		borderRadius: ms(999),
		paddingHorizontal: s(10),
		paddingVertical: vs(6),
	},
	badgeText: {
		...typography.bodyXSSemibold,
		color: Colors.POINTCOLOR,
	},
	closeButton: {
		padding: ms(2),
	},
	title: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
	},
	bodySection: {
		marginTop: vs(16),
		flex: 1,
		minHeight: 0,
	},
	descriptionScroll: {
		flex: 1,
	},
	descriptionContent: {
		paddingRight: s(4),
	},
	description: {
		...typography.bodyMRegular,
		fontSize: ms(15),
		lineHeight: vs(22),
		color: Colors.BODYTEXT_SUB,
	},
	footer: {
		marginTop: vs(16),
		gap: vs(40),
	},
	checkbox: {
		alignSelf: 'flex-start',
	},
	checkboxLabel: {
		...typography.bodySSmallMedium,
		fontSize: ms(13),
		lineHeight: vs(16),
		color: Colors.POINTCOLOR,
	},
	buttonWrapper: {
		alignItems: 'center',
	},
	button: {
		borderRadius: ms(12),
	},
})

export default AnnouncementModal
