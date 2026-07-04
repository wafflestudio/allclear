import { useQuery } from '@tanstack/react-query'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { useProfile } from '@/shared/contexts/profileContext'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { ms, s, vs } from '@/shared/utils/scale'
import { navigation } from '@/shared/utils/navigation'
import Header from '@/shared/components/BackHeader'
import React, { useContext, useState } from 'react'
import {
	ActivityIndicator,
	Keyboard,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native'
import DropDownPicker from 'react-native-dropdown-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import Icon from 'react-native-vector-icons/MaterialIcons'
import CommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons'

const EditProfileScreen = () => {
	const { user, setUser } = useProfile()
	const { data: collegeMajors } = useCollegeMajors()
	const { userService } = useContext(serviceContext)

	const [name, setName] = useState(user?.nickname || '')
	const [college, setCollege] = useState(user?.college || '')
	const [major, setMajor] = useState(user?.major || '')
	const [admissionClass, setAdmissionClass] = useState(user?.admissionClass ?? 26)

	const [openCollegeDropDown, setOpenCollegeDropDown] = useState(false)
	const [openMajorDropDown, setOpenMajorDropDown] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const isFormValid = !!name && !!college && !!major
	const hasChanges =
		name !== (user?.nickname || '') ||
		college !== (user?.college || '') ||
		major !== (user?.major || '') ||
		admissionClass !== (user?.admissionClass ?? 26)
	const canSubmit = isFormValid && hasChanges

	const colleges = collegeMajors?.reduce((acc, cur) => {
		if (cur.college && !acc.includes(cur.college)) {
			acc.push(cur.college)
		}
		return acc
	}, [] as string[])

	const majors = collegeMajors?.reduce((acc, cur) => {
		if (cur.major && !acc.includes(cur.major) && cur.college === college) {
			acc.push(cur.major)
		}
		return acc
	}, [] as string[])

	const handleSubmit = async () => {
		try {
			setIsSubmitting(true)

			const collegeMajorId = collegeMajors?.find(
				cm => cm.college === college && cm.major === major,
			)?.id

			if (!collegeMajorId) {
				Toast.show({ type: 'info', text1: '단과대 및 학과를 다시 선택해주세요' })
				return
			}

			Keyboard.dismiss()
			await userService.updateUser({ nickname: name, collegeMajorId, major, admissionClass })

			const updatedUser = await userService.getUser()
			setUser(updatedUser)
			navigation.goBack()

			Toast.show({ type: 'info', text1: '프로필이 수정되었어요!' })
		} catch {
			Toast.show({ type: 'info', text1: '이런! 문제가 생겼어요!' })
		} finally {
			setIsSubmitting(false)
		}
	}

	const closeDropdowns = () => {
		setOpenCollegeDropDown(false)
		setOpenMajorDropDown(false)
	}

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
			<Header title="프로필 수정" onBack={() => navigation.goBack()} />

			<Pressable style={styles.formArea} onPress={closeDropdowns}>
				<View style={styles.card}>
					<Text style={styles.label}>이름</Text>
					<TextInput
						style={styles.input}
						value={name}
						onChangeText={setName}
						onFocus={closeDropdowns}
						placeholder="이름을 입력하세요"
						placeholderTextColor={Colors.BODYTEXT_DISABLED}
						maxLength={20}
					/>
				</View>

				<View style={[styles.card, { zIndex: 10 }]}>
					<Text style={styles.label}>단과대 및 학과</Text>
					<DropDownPicker
						open={openCollegeDropDown}
						setOpen={val => {
							setOpenCollegeDropDown(val)
							setOpenMajorDropDown(false)
						}}
						value={college}
						setValue={setCollege}
						onSelectItem={item => {
							if (item.value !== college) setMajor('')
						}}
						items={colleges?.map(c => ({ label: c, value: c })) ?? []}
						placeholder="단과대를 선택해주세요"
						style={styles.picker}
						dropDownContainerStyle={styles.pickerDropdown}
						placeholderStyle={styles.pickerPlaceholder}
						textStyle={styles.pickerText}
						closeOnBackPressed
						ArrowDownIconComponent={renderArrowDownIcon}
						ArrowUpIconComponent={renderArrowUpIcon}
					/>
					<View style={styles.pickerGap} />
					<DropDownPicker
						disabled={!college}
						disabledStyle={styles.pickerDisabled}
						open={openMajorDropDown}
						setOpen={val => {
							setOpenCollegeDropDown(false)
							setOpenMajorDropDown(val)
						}}
						value={major}
						setValue={setMajor}
						items={majors?.map(c => ({ label: c, value: c })) ?? []}
						placeholder="학과를 선택해주세요"
						style={[styles.picker, { zIndex: -1 }]}
						dropDownContainerStyle={styles.pickerDropdown}
						placeholderStyle={styles.pickerPlaceholder}
						textStyle={styles.pickerText}
						closeOnBackPressed
						ArrowDownIconComponent={renderArrowDownIcon}
						ArrowUpIconComponent={renderArrowUpIcon}
					/>
				</View>

				<View style={styles.card}>
					<Text style={styles.label}>학번</Text>
					<View style={styles.stepperRow}>
						<Pressable
							style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
							onPress={() => setAdmissionClass(Math.max(admissionClass - 1, 0))}>
							<CommunityIcon name="minus" size={ms(24)} color={Colors.BODYTEXT_DISABLED} />
						</Pressable>
						<Text
							style={styles.stepperValue}>{`${String(admissionClass).padStart(2, '0')}학번`}</Text>
						<Pressable
							style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
							onPress={() => setAdmissionClass(Math.min(admissionClass + 1, 30))}>
							<CommunityIcon name="plus" size={ms(24)} color={Colors.BODYTEXT_DISABLED} />
						</Pressable>
					</View>
				</View>
			</Pressable>

			<View style={styles.submitContainer}>
				<Pressable
					disabled={!canSubmit || isSubmitting}
					onPress={handleSubmit}
					style={({ pressed }) => [
						styles.submitButton,
						(!canSubmit || isSubmitting) && styles.submitButtonDisabled,
						pressed && canSubmit && styles.pressed,
					]}>
					{isSubmitting ? (
						<ActivityIndicator color={Colors.WHITE} />
					) : (
						<Text style={styles.submitText}>저장</Text>
					)}
				</Pressable>
			</View>
		</SafeAreaView>
	)
}

export default EditProfileScreen

const useCollegeMajors = () => {
	const { userService } = useContext(serviceContext)
	return useQuery(['collegeMajors'], () => userService.listCollegeMajors(), {
		keepPreviousData: true,
		select: data => data.majors,
	})
}

function renderArrowDownIcon() {
	return <Icon name="keyboard-arrow-down" size={ms(24)} color={Colors.BODYTEXT_DISABLED} />
}

function renderArrowUpIcon() {
	return <Icon name="keyboard-arrow-up" size={ms(24)} color={Colors.BODYTEXT_DISABLED} />
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	formArea: {
		flex: 1,
		padding: s(16),
		gap: vs(12),
	},
	card: {
		backgroundColor: Colors.WHITE,
		borderRadius: ms(12),
		paddingHorizontal: s(24),
		paddingVertical: s(20),
	},
	label: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		marginBottom: vs(8),
	},
	input: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_MAIN,
	},
	picker: {
		borderWidth: 0,
		paddingHorizontal: 0,
		paddingVertical: vs(4),
		backgroundColor: Colors.WHITE,
		borderRadius: ms(12),
	},
	pickerDropdown: {
		borderWidth: 0,
		backgroundColor: Colors.WHITE,
		paddingHorizontal: s(4),
		paddingVertical: vs(4),
	},
	pickerPlaceholder: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_DISABLED,
	},
	pickerText: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_MAIN,
	},
	pickerDisabled: {
		backgroundColor: Colors.TEXTBOX_UNSELECTED,
		borderRadius: ms(12),
	},
	pickerGap: {
		height: vs(8),
	},
	stepperRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	stepperValue: {
		...typography.bodyMSemibold,
		color: Colors.BODYTEXT_MAIN,
	},
	stepperBtn: {
		padding: s(4),
	},
	pressed: {
		opacity: 0.5,
	},
	submitContainer: {
		paddingHorizontal: s(16),
		paddingBottom: vs(16),
	},
	submitButton: {
		backgroundColor: Colors.BUTTON_SELECTED,
		borderRadius: ms(12),
		paddingVertical: vs(16),
		alignItems: 'center',
	},
	submitButtonDisabled: {
		opacity: 0.4,
	},
	submitText: {
		...typography.bodyMSemibold,
		color: Colors.WHITE,
	},
})
