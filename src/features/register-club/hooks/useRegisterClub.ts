import { useMutation } from '@tanstack/react-query'
import { useContext } from 'react'
import { RegisterClubImageFile } from '@/features/register-club/types'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { RegisterClubRequest, RegisterClubResponse } from '@/repositories/club'

const DEFAULT_ERROR_MESSAGE = '동아리 등록 중 오류가 발생했습니다'
const MISSING_CLUB_UUID_MESSAGE = '동아리 등록 응답에서 동아리 ID를 찾지 못했어요'
const IMAGE_UPLOAD_ERROR_MESSAGE =
	'동아리 등록은 완료됐지만 대표 이미지를 업로드하지 못했어요. 관리 화면에서 다시 등록해주세요'

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

type RegisterClubMutationRequest = {
	request: RegisterClubRequest
	imageFile?: RegisterClubImageFile | null
}

export const useRegisterClub = ({ onSuccess, onFailure }: Callbacks) => {
	const { clubService } = useContext(serviceContext)

	return useMutation(
		async ({ request, imageFile }: RegisterClubMutationRequest) => {
			const response = await clubService.registerClub(request)

			if (response?.success !== true || !imageFile) {
				return response
			}

			const clubId = response.data?.club?.uuid
			if (!clubId) {
				throw new Error(MISSING_CLUB_UUID_MESSAGE)
			}

			try {
				await clubService.uploadManagedClubImage({
					clubId,
					uri: imageFile.uri,
					type: imageFile.type,
					name: imageFile.name,
				})
			} catch {
				throw new Error(IMAGE_UPLOAD_ERROR_MESSAGE)
			}

			return response
		},
		{
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
		},
	)
}
