import { Category } from '@/entities/category'

export type RegisterClubFormData = {
	clubType: '교내' | '교외'

	// Page 1: Manager basic info
	managerName: string
	managerPhone: string
	studentId: string

	// Page 2: Club basic info
	clubImage: string | null // Base64 or URI
	clubName: string

	// Page 3: Categories
	selectedCategories: Category['name'][]

	// Page 4: Club intro & affiliation
	department: string
	shortIntro: string

	// Page 5: Club details
	recruitType: string
	activityCycle: string
	hasDongbang: boolean
	dongbangLocation: string
	clubSNS: string
	clubDescription: string
}

export const initialFormData: RegisterClubFormData = {
	clubType: '교내',
	managerName: '',
	managerPhone: '',
	studentId: '',
	clubImage: null,
	clubName: '',
	selectedCategories: [],
	department: '',
	shortIntro: '',
	recruitType: '',
	activityCycle: '',
	hasDongbang: false,
	dongbangLocation: '',
	clubSNS: '',
	clubDescription: '',
}
