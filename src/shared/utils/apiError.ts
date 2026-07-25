import axios from 'axios'

export const getApiErrorStatus = (error: unknown): number | undefined => {
	if (!axios.isAxiosError(error)) {
		return undefined
	}

	return error.response?.status
}
