export type ManagedClubManagerPatch = {
	name?: string
	phone?: string
	studentId?: string
}

export type ManagedClubManagerData = {
	name?: string
	phone?: string
	student_id?: string
}

export type ManagedClubUpdateBody<TClubData extends object> = {
	resubmit?: boolean
	club_data?: TClubData
	manager_data?: ManagedClubManagerData
}

export const buildManagedClubUpdateBody = <TClubData extends object>(
	clubData: TClubData,
	managerData?: ManagedClubManagerPatch,
	resubmit = false,
): ManagedClubUpdateBody<TClubData> => {
	const managerPayload = managerData
		? {
				...(managerData.name !== undefined && { name: managerData.name }),
				...(managerData.phone !== undefined && { phone: managerData.phone }),
				...(managerData.studentId !== undefined && { student_id: managerData.studentId }),
			}
		: undefined
	const body: ManagedClubUpdateBody<TClubData> = {
		...(resubmit && { resubmit: true }),
		...(Object.keys(clubData).length > 0 && { club_data: clubData }),
		...(managerPayload &&
			Object.keys(managerPayload).length > 0 && {
				manager_data: managerPayload,
			}),
	}

	if (!body.resubmit && !body.club_data && !body.manager_data) {
		throw new Error('At least one managed club field is required')
	}

	return body
}
