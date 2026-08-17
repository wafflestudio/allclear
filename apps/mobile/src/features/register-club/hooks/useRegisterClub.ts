import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";
import type { RegisterClubImageFile } from "@/features/register-club/types";
import type {
	RegisterClubRequest,
	RegisterClubResponse,
} from "@/repositories/club";
import { serviceContext } from "@/shared/contexts/serviceContext";

const DEFAULT_ERROR_MESSAGE = "동아리 등록 중 오류가 발생했습니다";
const MISSING_CLUB_UUID_MESSAGE =
	"동아리 등록 응답에서 동아리 ID를 찾지 못했어요";
const IMAGE_UPLOAD_ERROR_MESSAGE =
	"동아리 등록은 완료됐지만 대표 이미지를 업로드하지 못했어요. 관리 화면에서 다시 등록해주세요";
const ACTIVITY_IMAGE_UPLOAD_ERROR_MESSAGE =
	"동아리 등록은 완료됐지만 활동 사진을 업로드하지 못했어요. 관리 화면에서 다시 등록해주세요";

const extractErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		const axiosError = error as {
			response?: { status?: number; data?: { message?: string } };
		};
		if (axiosError.response?.data?.message) {
			return axiosError.response.data.message;
		}
		if (axiosError.response?.status) {
			return `Error ${axiosError.response.status}: ${error.message}`;
		}
	}
	return DEFAULT_ERROR_MESSAGE;
};

type Callbacks = {
	onSuccess: (message: string) => void;
	onFailure: (message: string) => void;
};

type RegisterClubMutationRequest = {
	request: RegisterClubRequest;
	imageFile?: RegisterClubImageFile | null;
	activityImageFiles?: RegisterClubImageFile[];
};

export const useRegisterClub = ({ onSuccess, onFailure }: Callbacks) => {
	const { clubService } = useContext(serviceContext);

	return useMutation(
		async ({
			request,
			imageFile,
			activityImageFiles = [],
		}: RegisterClubMutationRequest) => {
			const response = await clubService.registerClub(request);

			if (
				response?.success !== true ||
				(!imageFile && activityImageFiles.length === 0)
			) {
				return response;
			}

			const clubId = response.data?.club?.uuid;
			if (!clubId) {
				throw new Error(MISSING_CLUB_UUID_MESSAGE);
			}

			if (imageFile) {
				try {
					await clubService.uploadManagedClubImage({ clubId, ...imageFile });
				} catch {
					throw new Error(IMAGE_UPLOAD_ERROR_MESSAGE);
				}
			}

			if (activityImageFiles.length > 0) {
				try {
					const uploadedImages = await Promise.all(
						activityImageFiles.map((file) =>
							clubService.uploadClubActivityImage({ clubId, ...file }),
						),
					);
					await clubService.updateManagedClub({
						uuid: clubId,
						activity_image_urls: uploadedImages.map((image) => image.url),
					});
				} catch {
					throw new Error(ACTIVITY_IMAGE_UPLOAD_ERROR_MESSAGE);
				}
			}

			return response;
		},
		{
			onSuccess: (response: RegisterClubResponse) => {
				if (response?.success === true) {
					onSuccess(response.message || "동아리 등록이 완료되었습니다!");
				} else {
					onFailure(response?.message || DEFAULT_ERROR_MESSAGE);
				}
			},
			onError: (error: unknown) => {
				onFailure(extractErrorMessage(error));
			},
		},
	);
};
