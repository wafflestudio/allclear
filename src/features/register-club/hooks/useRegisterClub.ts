import { useMutation } from '@tanstack/react-query'
import { useContext } from 'react'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { RegisterClubRequest, RegisterClubResponse } from '@/repositories/club'

const DEFAULT_ERROR_MESSAGE = '동아리 등록 중 오류가 발생했습니다'

const extractErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		const axiosError = error as { response?: { status?: number; data?: { message?: string } } }
		if (axiosError.response?.data?.message) {
			return axiosError.response.data.message
		}
		if (axiosError.response?.status) {
			return `Error ${axiosError.response.status}: ${error.message}`
		}
	}
	return DEFAULT_ERROR_MESSAGE
}

type Callbacks = {
	onSuccess: (message: string) => void
	onFailure: (message: string) => void
}

export const useRegisterClub = ({ onSuccess, onFailure }: Callbacks) => {
	const { clubService } = useContext(serviceContext)

	return useMutation((request: RegisterClubRequest) => clubService.registerClub(request), {
		onSuccess: (response: RegisterClubResponse) => {
			if (response?.success === true) {
				onSuccess(response.message || '동아리 등록이 완료되었습니다!')
			} else {
				onFailure(response?.message || DEFAULT_ERROR_MESSAGE)
			}
		},
		onError: (error: unknown) => {
			onFailure(extractErrorMessage(error))
		},
	})
}
