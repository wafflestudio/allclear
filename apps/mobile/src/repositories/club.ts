import type {
	Club,
	ClubRanking,
	ManagedClubListItem,
	ManagedOfficialVerification,
} from "@/entities/club";
import type { ManagedClubManagerPatch } from "@/repositories/managedClubUpdate";
import { buildManagedClubUpdateBody } from "@/repositories/managedClubUpdate";
import { apiConnector } from "@/shared/utils/api";

export type { ManagedClubManagerPatch } from "@/repositories/managedClubUpdate";

export type ClubSearchAffiliationType =
	| "전체"
	| "중앙동아리"
	| "학과/단과대동아리";
export type ClubSearchRecruitType = "정기" | "상시";
export type ClubSearchBooleanString = "true" | "false";
export type ClubSearchMinActivityPeriod = "0" | "1" | "2" | "3_plus";

export type SearchClubsRequest = {
	query: string;
	affiliation_type?: ClubSearchAffiliationType;
	is_recruiting?: ClubSearchBooleanString;
	recruit_type?: ClubSearchRecruitType;
	has_membership_fee?: ClubSearchBooleanString;
	has_dongbang?: ClubSearchBooleanString;
	is_official_verified?: ClubSearchBooleanString;
	min_activity_period?: ClubSearchMinActivityPeriod[];
};

export type SearchClubsResponse = {
	clubs: Club[];
	totalSize: number;
	query: string;
	correctedQuery: string | null;
	isTypoCorrected: boolean;
};

export type ListPopularClubsResponse = {
	clubs: Club[];
	totalSize: number;
};

export type ListLatestClubsResponse = {
	clubs: Club[];
	totalSize: number;
};

export type ListClubsRequest = {
	category?: Club["category"];
	name?: Club["name"];
};

export type ListClubsResponse = {
	clubs: Club[];
	totalSize: number;
};

export type GetClubRequest = {
	uuid: Club["uuid"];
};

export type ClubManager = {
	serviceUserId: string;
	name: string;
	phone: string;
	studentId: string;
};

export type ManagedClubDetail = Club & {
	managers: ClubManager[];
	officialVerification: ManagedOfficialVerification;
};

export type GetManagedClubDetailRequest = {
	uuid: Club["uuid"];
};

export type ListManageClubsResponse = {
	clubs: ManagedClubListItem[];
	totalSize: number;
};

type ManagedClubListItemResponse = Omit<ManagedClubListItem, "hasManager"> & {
	hasManager?: boolean;
};

type ListManageClubsV2Response = {
	success: boolean;
	message: string;
	data: {
		total_count: number;
		clubs: ManagedClubListItemResponse[];
	};
};

export type ListClubRankingsRequest = {
	topK?: number;
};

export type ListClubRankingsResponse = {
	rankings: ClubRanking[];
	totalSize: number;
};

export type RequestClubmanagerRequest = {
	clubId: Club["uuid"];
	name: string;
	phone: string;
	studentId: string;
};

export type UpdateClubManagerRequest = {
	clubId: Club["uuid"];
	name?: string;
	phone?: string;
	studentId?: string;
	resubmit?: boolean;
};

export type ClubRequestTarget = {
	clubId: Club["uuid"];
};

export type ClubManagerRequestDetail = {
	name: string;
	phone: string;
	studentId: string;
};

type ClubManagerRequestDetailResponse = {
	name: string;
	phone: string;
	student_id: string;
};

export type ManagedClubRequestTarget = {
	uuid: Club["uuid"];
};

export type RequestOfficialVerificationRequest = {
	clubId: Club["uuid"];
};

export type RequestOfficialVerificationResponse = {
	success: true;
	message: string;
	data: {
		request_id: number;
		club_uuid: Club["uuid"];
		status: "PENDING";
		created_at: string;
		attempt_no: number;
		retry_count: number;
		remaining_retry_count: number;
	};
};

export type ListSavedClubsResponse = {
	clubs: Club[];
	totalSize: number;
};

export type CreateSavedClubRequest = {
	clubId: Club["uuid"];
};

export type RemoveSavedClubRequest = {
	clubId: Club["uuid"];
};

export type RegisterClubRequest = {
	club_data: {
		name: string;
		type: string;
		image_uri?: string;
		category: string;
		affiliation: string;
		short_description: string;
		recruit_type: string;
		min_activity_period: number;
		has_dongbang: boolean;
		dongbang_location?: string;
		sns_urls: string[];
		introduction: string;
		activity_image_urls?: string[];
	};
	manager_data: {
		name: string;
		phone: string;
		student_id: string;
	};
};

export type RegisterClubResponse = {
	success: boolean;
	message: string;
	data?: {
		club?: {
			uuid: Club["uuid"];
			name: Club["name"];
			imageUri: Club["imageUri"];
			status: string;
		};
	};
};

export type UpdateManagedClubRequest = {
	uuid: Club["uuid"];
	name?: string;
	type?: string;
	image_uri?: string;
	category?: Club["category"];
	affiliation?: string;
	short_description?: string;
	recruit_type?: string;
	min_activity_period?: number;
	has_dongbang?: boolean;
	dongbang_location?: string;
	sns_urls?: string[];
	introduction?: string;
	activity_image_urls?: string[];
	manager_data?: ManagedClubManagerPatch;
	resubmit?: boolean;
};

export type UpdateManagedClubResponse = {
	success: boolean;
	message: string;
	data: {
		club_uuid: Club["uuid"];
		updated_at: string;
	};
};

export type UploadManagedClubImageRequest = {
	clubId: Club["uuid"];
	uri: string;
	type: string;
	name: string;
};

export type UploadManagedClubImageResponse = {
	ok: boolean;
};

export type UploadClubActivityImageRequest = UploadManagedClubImageRequest;

export type UploadClubActivityImageResponse = {
	url: string;
};

export type ListMyClubsResponse = {
	clubs: Club[];
	totalSize: number;
};

export type ListRandomRecommendationsResponse = {
	clubs: Club[];
	totalSize: number;
};

export type ClubRepository = {
	searchClubs: (
		req: SearchClubsRequest,
		signal?: AbortSignal,
	) => Promise<SearchClubsResponse>;
	listPopularClubs: () => Promise<ListPopularClubsResponse>;
	listLatestClubs: () => Promise<ListLatestClubsResponse>;
	listClubs: (req: ListClubsRequest) => Promise<ListClubsResponse>;
	getClub: (req: GetClubRequest) => Promise<Club>;
	getManagedClubDetail: (
		req: GetManagedClubDetailRequest,
	) => Promise<ManagedClubDetail>;
	listManageClubs: () => Promise<ListManageClubsResponse>;
	listClubRankings: (
		req: ListClubRankingsRequest,
	) => Promise<ListClubRankingsResponse>;
	requestClubManager: (req: RequestClubmanagerRequest) => Promise<void>;
	getClubManagerRequest: (
		req: ClubRequestTarget,
	) => Promise<ClubManagerRequestDetail>;
	updateClubManagerRequest: (req: UpdateClubManagerRequest) => Promise<void>;
	getManagedClubManager: (
		req: ManagedClubRequestTarget,
	) => Promise<ClubManagerRequestDetail>;
	requestOfficialVerification: (
		req: RequestOfficialVerificationRequest,
	) => Promise<RequestOfficialVerificationResponse>;
	cancelClubManagerRequest: (req: ClubRequestTarget) => Promise<void>;
	cancelManagedClubRequest: (req: ManagedClubRequestTarget) => Promise<void>;
	listSavedClubs: () => Promise<ListSavedClubsResponse>;
	createSavedClub: (req: CreateSavedClubRequest) => Promise<void>;
	removeSavedClub: (req: RemoveSavedClubRequest) => Promise<void>;
	listMyClubs: () => Promise<ListMyClubsResponse>;
	registerClub: (req: RegisterClubRequest) => Promise<RegisterClubResponse>;
	updateManagedClub: (
		req: UpdateManagedClubRequest,
	) => Promise<UpdateManagedClubResponse>;
	uploadManagedClubImage: (
		req: UploadManagedClubImageRequest,
	) => Promise<UploadManagedClubImageResponse>;
	uploadClubActivityImage: (
		req: UploadClubActivityImageRequest,
	) => Promise<UploadClubActivityImageResponse>;
	listRandomRecommendations: () => Promise<ListRandomRecommendationsResponse>;
};

export const getClubRepository = (): ClubRepository => ({
	searchClubs: async (req, signal) => {
		const searchParams = new URLSearchParams();
		searchParams.append("query", req.query.toLowerCase().trim());
		if (req.affiliation_type && req.affiliation_type !== "전체") {
			searchParams.append("affiliation_type", req.affiliation_type);
		}
		if (req.is_recruiting) {
			searchParams.append("is_recruiting", req.is_recruiting);
		}
		if (req.recruit_type) {
			searchParams.append("recruit_type", req.recruit_type);
		}
		if (req.has_membership_fee) {
			searchParams.append("has_membership_fee", req.has_membership_fee);
		}
		if (req.has_dongbang) {
			searchParams.append("has_dongbang", req.has_dongbang);
		}
		if (req.is_official_verified) {
			searchParams.append("is_official_verified", req.is_official_verified);
		}
		req.min_activity_period?.forEach((period) => {
			searchParams.append("min_activity_period", period);
		});

		const response = await apiConnector.get<SearchClubsResponse>(
			"/v2/clubs/search",
			searchParams,
			signal,
		);

		return response;
	},
	listPopularClubs: async () => {
		const response =
			await apiConnector.get<ListPopularClubsResponse>("/v2/clubs/popular");

		return response;
	},
	listLatestClubs: async () => {
		const response =
			await apiConnector.get<ListLatestClubsResponse>("/v2/clubs/latest");

		return response;
	},
	listClubs: async (req) => {
		const response = await apiConnector.get<ListClubsResponse>("/v2/clubs", {
			...(req.category && { category: req.category }),
		});

		return response;
	},
	getClub: async (req) => {
		const club = await apiConnector.get<Club>(`/v2/clubs/${req.uuid}`);

		if (!club) {
			throw new Error("Club not found");
		}
		return club;
	},
	getManagedClubDetail: async (req) => {
		const res = await apiConnector.get<ManagedClubDetail>(
			`/v2/managers/me/clubs/${req.uuid}`,
		);
		return res;
	},
	listManageClubs: async () => {
		const response = await apiConnector.get<ListManageClubsV2Response>(
			"/v2/managers/me/clubs",
		);
		return {
			clubs: response.data.clubs.map((club) => ({
				...club,
				hasManager: club.hasManager ?? false,
			})),
			totalSize: response.data.total_count,
		};
	},
	listClubRankings: async (req) => {
		const response = await apiConnector.get<ListClubRankingsResponse>(
			`/v2/clubs/rankings?topk=${req.topK ?? 5}`,
		);

		return response;
	},
	requestClubManager: async (req) => {
		await apiConnector.post<void>(`/v2/clubs/${req.clubId}/manager-requests`, {
			name: req.name,
			phone: req.phone,
			student_id: req.studentId,
		});
	},
	getClubManagerRequest: async (req) => {
		const response = await apiConnector.get<ClubManagerRequestDetailResponse>(
			`/v2/clubs/${req.clubId}/manager-requests`,
		);

		return {
			name: response.name,
			phone: response.phone,
			studentId: response.student_id,
		};
	},
	updateClubManagerRequest: async (req) => {
		await apiConnector.patch<void>(`/v2/clubs/${req.clubId}/manager-requests`, {
			...(req.name !== undefined && { name: req.name }),
			...(req.phone !== undefined && { phone: req.phone }),
			...(req.studentId !== undefined && { student_id: req.studentId }),
			...(req.resubmit && { resubmit: true }),
		});
	},
	getManagedClubManager: async (req) => {
		const response = await apiConnector.get<ClubManagerRequestDetailResponse>(
			`/v2/managers/me/clubs/${req.uuid}/manager`,
		);

		return {
			name: response.name,
			phone: response.phone,
			studentId: response.student_id,
		};
	},
	requestOfficialVerification: (req) =>
		apiConnector.post<RequestOfficialVerificationResponse>(
			`/v2/managers/me/clubs/${req.clubId}/verifications`,
		),
	cancelClubManagerRequest: async (req) => {
		await apiConnector.delete<void>(`/v2/clubs/${req.clubId}/manager-requests`);
	},
	cancelManagedClubRequest: async (req) => {
		await apiConnector.delete<void>(`/v2/managers/me/clubs/${req.uuid}`);
	},
	listSavedClubs: async () => {
		const response = await apiConnector.get<ListSavedClubsResponse>(
			"/v2/users/me/clubs/saved",
		);

		return response;
	},
	createSavedClub: async (req) => {
		await apiConnector.post<void>(`/v2/clubs/${req.clubId}/saved`);
	},
	removeSavedClub: async (req) => {
		await apiConnector.delete<void>(`/v2/clubs/${req.clubId}/saved`);
	},
	listMyClubs: async () => {
		const response =
			await apiConnector.get<ListMyClubsResponse>("/v2/users/me/clubs");

		return response;
	},
	listRandomRecommendations: async () => {
		const response = await apiConnector.get<ListRandomRecommendationsResponse>(
			"/v2/clubs/recommendations/random",
		);

		return response;
	},
	registerClub: async (req) => {
		const response = await apiConnector.post<RegisterClubResponse>(
			"/v2/clubs/register",
			req,
		);

		return response;
	},
	updateManagedClub: async (req) => {
		const { uuid, manager_data: managerData, resubmit, ...clubData } = req;
		const response = await apiConnector.patch<UpdateManagedClubResponse>(
			`/v2/managers/me/clubs/${uuid}`,
			buildManagedClubUpdateBody(clubData, managerData, resubmit),
		);

		return response;
	},
	uploadManagedClubImage: async (req) => {
		const formData = new FormData();
		formData.append("file", {
			uri: req.uri,
			type: req.type,
			name: req.name,
		} as unknown as Blob);

		const response = await apiConnector.post<UploadManagedClubImageResponse>(
			`/v2/managers/me/clubs/${req.clubId}/images`,
			formData as unknown as object,
			{ timeout: 60000, headers: { "Content-Type": "multipart/form-data" } },
		);

		return response;
	},
	uploadClubActivityImage: async (req) => {
		const formData = new FormData();
		formData.append("file", {
			uri: req.uri,
			type: req.type,
			name: req.name,
		} as unknown as Blob);

		return apiConnector.post<UploadClubActivityImageResponse>(
			`/v2/managers/me/clubs/${req.clubId}/activity-images`,
			formData as unknown as object,
			{ timeout: 60000, headers: { "Content-Type": "multipart/form-data" } },
		);
	},
});
