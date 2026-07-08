import { CollegeMajor } from '@/entities/user'

const CENTRAL_CLUB_OPTION = '중앙동아리'
const ETC_OPTION = '기타'
const INTERDISCIPLINARY_MAJOR_PREFIX = '연합전공'
const LINKED_MAJOR_PREFIX = '연계전공'

const sortDepartmentName = (a: string, b: string) => a.localeCompare(b, 'ko')

export const buildDepartmentOptions = (collegeMajors: CollegeMajor[] = []) => {
	const dynamicDepartments = collegeMajors
		.map(collegeMajor => collegeMajor.major || collegeMajor.college)
		.filter((department): department is string => !!department)

	const uniqueDepartments = Array.from(
		new Set([CENTRAL_CLUB_OPTION, ...dynamicDepartments, ETC_OPTION]),
	)

	const regularDepartments = uniqueDepartments
		.filter(
			department =>
				department !== CENTRAL_CLUB_OPTION &&
				department !== ETC_OPTION &&
				!department.startsWith(INTERDISCIPLINARY_MAJOR_PREFIX) &&
				!department.startsWith(LINKED_MAJOR_PREFIX),
		)
		.sort(sortDepartmentName)
	const interdisciplinaryMajors = uniqueDepartments
		.filter(department => department.startsWith(INTERDISCIPLINARY_MAJOR_PREFIX))
		.sort(sortDepartmentName)
	const linkedMajors = uniqueDepartments
		.filter(department => department.startsWith(LINKED_MAJOR_PREFIX))
		.sort(sortDepartmentName)

	return [
		CENTRAL_CLUB_OPTION,
		...regularDepartments,
		...interdisciplinaryMajors,
		...linkedMajors,
		ETC_OPTION,
	]
}

export const DEFAULT_DEPARTMENT_OPTIONS = buildDepartmentOptions()
