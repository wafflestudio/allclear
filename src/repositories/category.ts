import { Category } from '@/entities/category'
import { apiConnector } from '@/shared/utils/api'

export type ListCategoriesResponse = {
	categories: Category[]
	totalSize: number
}

export type CategoryRepository = {
	listCategories: () => Promise<ListCategoriesResponse>
}

export const getCategoryRepository = (): CategoryRepository => ({
	listCategories: async () => {
		const response = await apiConnector.get<ListCategoriesResponse>('/v2/clubs/categories')

		return response
	},
})
