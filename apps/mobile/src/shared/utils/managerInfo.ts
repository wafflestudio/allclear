const getInputDigits = (value: string, previousValue: string): string => {
	const isDeletingTrailingHyphen =
		previousValue.endsWith("-") && value === previousValue.slice(0, -1);
	const valueWithoutAutoHyphen = isDeletingTrailingHyphen
		? value.slice(0, -1)
		: value;

	return valueWithoutAutoHyphen.replace(/\D/g, "");
};

export const formatPhoneNumberInput = (
	value: string,
	previousValue: string,
): string => {
	const digits = getInputDigits(value, previousValue).slice(0, 11);

	if (digits.length < 3) {
		return digits;
	}
	if (digits.length === 3) {
		return `${digits}-`;
	}
	if (digits.length < 7) {
		return `${digits.slice(0, 3)}-${digits.slice(3)}`;
	}
	if (digits.length === 7) {
		return `${digits.slice(0, 3)}-${digits.slice(3)}-`;
	}

	return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const PHONE_NUMBER_PREFILL_PATTERN = /^(?:01\d-\d{4}-\d{4}|01\d{9})$/;

export const getPhoneNumberPrefill = (phone: string): string =>
	PHONE_NUMBER_PREFILL_PATTERN.test(phone)
		? formatPhoneNumberInput(phone, "")
		: "";

export const formatStudentIdInput = (
	value: string,
	previousValue: string,
): string => {
	const digits = getInputDigits(value, previousValue).slice(0, 9);

	if (digits.length < 4) {
		return digits;
	}
	if (digits.length === 4) {
		return `${digits}-`;
	}

	return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

export const getStudentIdPrefill = (admissionClass: number | null): string => {
	if (
		!Number.isInteger(admissionClass) ||
		admissionClass === null ||
		admissionClass < 0 ||
		admissionClass > 99
	) {
		return "";
	}

	return `20${String(admissionClass).padStart(2, "0")}-`;
};
