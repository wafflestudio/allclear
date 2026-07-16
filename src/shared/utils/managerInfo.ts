const getInputDigits = (value: string, previousValue: string): string => {
	const isDeletingTrailingHyphen =
		previousValue.endsWith('-') && value === previousValue.slice(0, -1)
	const valueWithoutAutoHyphen = isDeletingTrailingHyphen ? value.slice(0, -1) : value

	return valueWithoutAutoHyphen.replace(/\D/g, '')
}

export const formatPhoneNumberInput = (value: string, previousValue: string): string => {
	const digits = getInputDigits(value, previousValue).slice(0, 11)

	if (digits.length < 3) {
		return digits
	}
	if (digits.length === 3) {
		return `${digits}-`
	}
	if (digits.length < 7) {
		return `${digits.slice(0, 3)}-${digits.slice(3)}`
	}
	if (digits.length === 7) {
		return `${digits.slice(0, 3)}-${digits.slice(3)}-`
	}

	return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export const formatStudentIdInput = (value: string, previousValue: string): string => {
	const digits = getInputDigits(value, previousValue).slice(0, 9)

	if (digits.length < 4) {
		return digits
	}
	if (digits.length === 4) {
		return `${digits}-`
	}

	return `${digits.slice(0, 4)}-${digits.slice(4)}`
}
