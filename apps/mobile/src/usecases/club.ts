import type { Club } from "@/entities/club";
import type {
	AcceptManagerTransferInvitationResponse,
	ClubManagerRequestDetail,
	ClubRepository,
	ClubRequestTarget,
	CreateManagerTransferInvitationRequest,
	CreateManagerTransferInvitationResponse,
	CreateSavedClubRequest,
	GetClubRequest,
	GetManagedClubDetailRequest,
	ListClubRankingsRequest,
	ListClubRankingsResponse,
	ListClubsRequest,
	ListClubsResponse,
	ListLatestClubsResponse,
	ListManageClubsResponse,
	ListMyClubsResponse,
	ListRandomRecommendationsResponse,
	ListSavedClubsResponse,
	ManagedClubDetail,
	ManagedClubRequestTarget,
	ManagerTransferInvitation,
	ManagerTransferInvitationRequest,
	RegisterClubRequest,
	RegisterClubResponse,
	RemoveSavedClubRequest,
	RequestClubmanagerRequest,
	RequestOfficialVerificationRequest,
	RequestOfficialVerificationResponse,
	SearchClubsRequest,
	SearchClubsResponse,
	UpdateClubManagerRequest,
	UpdateManagedClubRequest,
	UpdateManagedClubResponse,
	UploadClubActivityImageRequest,
	UploadClubActivityImageResponse,
	UploadManagedClubImageRequest,
	UploadManagedClubImageResponse,
} from "@/repositories/club";

export type ClubService = {
	searchClubs: (
		req: SearchClubsRequest,
		signal?: AbortSignal,
	) => Promise<SearchClubsResponse>;
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
	createManagerTransferInvitation: (
		req: CreateManagerTransferInvitationRequest,
	) => Promise<CreateManagerTransferInvitationResponse>;
	getManagerTransferInvitation: (
		req: ManagerTransferInvitationRequest,
	) => Promise<ManagerTransferInvitation>;
	acceptManagerTransferInvitation: (
		req: ManagerTransferInvitationRequest,
	) => Promise<AcceptManagerTransferInvitationResponse>;
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

type Deps = {
	repositories: [ClubRepository];
};

export const getClubService = ({ repositories }: Deps): ClubService => ({
	searchClubs: (req, signal) => repositories[0].searchClubs(req, signal),
	listLatestClubs: () => repositories[0].listLatestClubs(),
	listClubs: (req) => repositories[0].listClubs(req),
	getClub: (req) => repositories[0].getClub(req),
	getManagedClubDetail: (req) => repositories[0].getManagedClubDetail(req),
	listManageClubs: () => repositories[0].listManageClubs(),
	listClubRankings: (req) => repositories[0].listClubRankings(req),
	requestClubManager: (req) => repositories[0].requestClubManager(req),
	getClubManagerRequest: (req) => repositories[0].getClubManagerRequest(req),
	updateClubManagerRequest: (req) =>
		repositories[0].updateClubManagerRequest(req),
	getManagedClubManager: (req) => repositories[0].getManagedClubManager(req),
	createManagerTransferInvitation: (req) =>
		repositories[0].createManagerTransferInvitation(req),
	getManagerTransferInvitation: (req) =>
		repositories[0].getManagerTransferInvitation(req),
	acceptManagerTransferInvitation: (req) =>
		repositories[0].acceptManagerTransferInvitation(req),
	requestOfficialVerification: (req) =>
		repositories[0].requestOfficialVerification(req),
	cancelClubManagerRequest: (req) =>
		repositories[0].cancelClubManagerRequest(req),
	cancelManagedClubRequest: (req) =>
		repositories[0].cancelManagedClubRequest(req),
	listSavedClubs: () => repositories[0].listSavedClubs(),
	createSavedClub: (req) => repositories[0].createSavedClub(req),
	removeSavedClub: (req) => repositories[0].removeSavedClub(req),
	listMyClubs: () => repositories[0].listMyClubs(),
	registerClub: (req) => repositories[0].registerClub(req),
	updateManagedClub: (req) => repositories[0].updateManagedClub(req),
	uploadManagedClubImage: (req) => repositories[0].uploadManagedClubImage(req),
	uploadClubActivityImage: (req) =>
		repositories[0].uploadClubActivityImage(req),
	listRandomRecommendations: () => repositories[0].listRandomRecommendations(),
});
