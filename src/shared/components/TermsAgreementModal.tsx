import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
	useWindowDimensions,
} from 'react-native'
import { BlurView } from '@react-native-community/blur'
import WebView from 'react-native-webview'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useMemo, useState } from 'react'
import BackHeader from '@/shared/components/BackHeader'
import Button from '@/shared/components/Button'
import Checkbox from '@/shared/components/Checkbox'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'
import { Term } from '@/entities/term'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
	visible: boolean
	terms: Term[]
	isSubmitting: boolean
	onAgree: (termUuids: Term['uuid'][]) => void
}

const TermsAgreementModal = ({ visible, terms, isSubmitting, onAgree }: Props) => {
	const { height: windowHeight } = useWindowDimensions()
	const insets = useSafeAreaInsets()
	const modalHeight = Math.min(vs(500), windowHeight - insets.top - insets.bottom - vs(40))
	const [checkedTermUuids, setCheckedTermUuids] = useState<Term['uuid'][]>([])
	const [viewingTerm, setViewingTerm] = useState<Term | null>(null)

	const mandatoryTermUuids = useMemo(
		() => terms.filter(term => term.isMandatory).map(term => term.uuid),
		[terms],
	)
	const allTermUuids = useMemo(() => terms.map(term => term.uuid), [terms])
	const isAllChecked = allTermUuids.length > 0 && checkedTermUuids.length === allTermUuids.length
	const isAgreeButtonEnabled =
		terms.length > 0 && mandatoryTermUuids.every(uuid => checkedTermUuids.includes(uuid))

	const handleToggleTerm = (termUuid: Term['uuid']) => {
		setCheckedTermUuids(prev =>
			prev.includes(termUuid) ? prev.filter(uuid => uuid !== termUuid) : [...prev, termUuid],
		)
	}

	const handleToggleAll = () => {
		setCheckedTermUuids(isAllChecked ? [] : allTermUuids)
	}

	const handleAgree = () => {
		if (!isAgreeButtonEnabled || isSubmitting) return

		onAgree(checkedTermUuids)
	}

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
			<View style={styles.overlay}>
				<Pressable style={styles.backdrop}>
					<BlurView
						style={styles.blur}
						blurType="light"
						blurAmount={1}
						overlayColor="transparent"
						reducedTransparencyFallbackColor="transparent"
					/>
				</Pressable>
				<View style={[styles.container, { height: modalHeight }]}>
					<View style={styles.contentSection}>
						<View style={styles.header}>
							<View style={styles.badge}>
								<Text style={styles.badgeText}>약관 동의</Text>
							</View>
						</View>

						<View style={styles.infoSection}>
							<Text style={styles.title}>약관 동의가 필요해요</Text>
							<Text style={styles.subtitle}>
								서비스 이용을 계속하려면 아래 약관에 동의해 주세요.
							</Text>
						</View>

						<View style={styles.bodySection}>
							<ScrollView
								style={styles.termList}
								showsVerticalScrollIndicator={false}
								bounces={false}>
								{terms.map((term, index) => {
									const isChecked = checkedTermUuids.includes(term.uuid)

									return (
										<View
											key={term.uuid}
											style={[styles.termRow, index < terms.length - 1 && styles.termRowBorder]}>
											<Checkbox
												label={`${term.isMandatory ? '[필수]' : '[선택]'} ${term.title}`}
												checked={isChecked}
												onPressIn={() => handleToggleTerm(term.uuid)}
												style={styles.termCheckbox}
												textStyle={[
													styles.termCheckboxLabel,
													term.isMandatory && styles.mandatoryLabel,
												]}
											/>
											<Pressable
												hitSlop={8}
												onPress={() => setViewingTerm(term)}
												style={({ pressed }) => [styles.viewButton, pressed && styles.pressed]}>
												<Text style={styles.viewButtonText}>보기</Text>
												<Icon name="chevron-right" size={ms(18)} color={Colors.BODYTEXT_SUB} />
											</Pressable>
										</View>
									)
								})}
							</ScrollView>

							<Checkbox
								label="전체 동의"
								checked={isAllChecked}
								onPressIn={handleToggleAll}
								textStyle={styles.allCheckboxLabel}
							/>
						</View>
					</View>

					<View style={styles.footer}>
						<Button
							label="동의하고 계속하기"
							onPress={handleAgree}
							disabled={!isAgreeButtonEnabled || isSubmitting}
							width={s(244)}
							style={styles.button}
						/>
					</View>
				</View>
			</View>

			<Modal
				visible={!!viewingTerm}
				animationType="slide"
				onRequestClose={() => setViewingTerm(null)}>
				<View
					style={[
						styles.webviewContainer,
						{
							paddingTop: insets.top,
							paddingBottom: insets.bottom,
							paddingLeft: insets.left,
							paddingRight: insets.right,
						},
					]}>
					<BackHeader title={viewingTerm?.title ?? ''} onBack={() => setViewingTerm(null)} />
					{viewingTerm && (
						<WebView
							source={{ uri: viewingTerm.contentUrl }}
							startInLoadingState
							bounces={false}
							overScrollMode="never"
						/>
					)}
				</View>
			</Modal>
		</Modal>
	)
}

export default TermsAgreementModal

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
		backgroundColor: Colors.WHITE,
		borderRadius: ms(28),
		paddingHorizontal: s(24),
		paddingTop: vs(20),
		paddingBottom: vs(24),
		gap: vs(24),
	},
	contentSection: {
		flex: 1,
		minHeight: 0,
		gap: vs(24),
	},
	header: {
		flexDirection: 'row',
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
	infoSection: {
		gap: vs(12),
	},
	title: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
	},
	subtitle: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
	},
	bodySection: {
		flex: 1,
		minHeight: 0,
		gap: vs(16),
	},
	termList: {
		height: vs(190),
	},
	termRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	termRowBorder: {
		borderBottomWidth: 1,
		borderBottomColor: Colors.TEXTBOX_UNSELECTED,
	},
	termCheckbox: {
		flex: 1,
	},
	termCheckboxLabel: {
		...typography.bodySMedium,
		color: Colors.BODYTEXT_MAIN,
	},
	mandatoryLabel: {
		color: Colors.BUTTON_DESTRUCTIVE,
	},
	viewButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	viewButtonText: {
		...typography.bodySMedium,
		color: Colors.BODYTEXT_SUB,
	},
	allCheckboxLabel: {
		...typography.bodySMedium,
		color: Colors.POINTCOLOR,
	},
	footer: {
		alignItems: 'center',
	},
	button: {
		borderRadius: ms(16),
	},
	pressed: {
		opacity: 0.7,
	},
	webviewContainer: {
		flex: 1,
		backgroundColor: Colors.WHITE,
	},
})
