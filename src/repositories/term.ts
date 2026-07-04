import AsyncStorage from '@react-native-async-storage/async-storage'
import { Term } from '@/entities/term'
import { LOGIN_TOKEN } from '@/shared/constants/localStorage'
import { apiConnector } from '@/shared/utils/api'

export type ListTermsResponse = {
	data: Term[]
}

export type AgreeTermsRequest = {
	termUuids: Term['uuid'][]
}

export type TermRepository = {
	listTerms: () => Promise<ListTermsResponse>
	agreeTerms: (request: AgreeTermsRequest) => Promise<void>
}

export const getTermRepository = (): TermRepository => ({
	listTerms: async () => {
		const token = await AsyncStorage.getItem(LOGIN_TOKEN)

		if (!token) {
			throw new Error('No token found')
		}

		const response = await apiConnector.get<ListTermsResponse>('/v2/terms')

		return response
	},
	agreeTerms: async request => {
		const token = await AsyncStorage.getItem(LOGIN_TOKEN)

		if (!token) {
			throw new Error('No token found')
		}

		await apiConnector.post('/v2/terms/agree', request)
	},
})
