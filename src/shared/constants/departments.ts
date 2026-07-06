import { CollegeMajor } from '@/entities/user'

const STATIC_DEPARTMENT_OPTIONS = ['중앙동아리']

export const buildDepartmentOptions = (collegeMajors: CollegeMajor[] = []) => {
	const dynamicDepartments = collegeMajors
		.map(collegeMajor => collegeMajor.major || collegeMajor.college)
		.filter((department): department is string => !!department)

	return Array.from(new Set([...STATIC_DEPARTMENT_OPTIONS, ...dynamicDepartments, '기타']))
}

export const DEFAULT_DEPARTMENT_OPTIONS = buildDepartmentOptions()
