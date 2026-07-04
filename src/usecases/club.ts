import { Club } from '@/entities/club'
import {
	ClubRepository,
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
	ListPopularClubsResponse,
	ListRandomRecommendationsResponse,
	ListSavedClubsResponse,
	ManagedClubDetail,
	RemoveSavedClubRequest,
	RequestClubmanagerRequest,
	SearchClubsRequest,
	SearchClubsResponse,
} from '@/repositories/club'

export type ClubService = {
	searchClubs: (req: SearchClubsRequest, signal?: AbortSignal) => Promise<SearchClubsResponse>
	listPopularClubs: () => Promise<ListPopularClubsResponse>
	listLatestClubs: () => Promise<ListLatestClubsResponse>
	listClubs: (req: ListClubsRequest) => Promise<ListClubsResponse>
	getClub: (req: GetClubRequest) => Promise<Club>
	getManagedClubDetail: (req: GetManagedClubDetailRequest) => Promise<ManagedClubDetail>
	listManageClubs: () => Promise<ListManageClubsResponse>
	listClubRankings: (req: ListClubRankingsRequest) => Promise<ListClubRankingsResponse>
	requestClubManager: (req: RequestClubmanagerRequest) => Promise<void>
	listSavedClubs: () => Promise<ListSavedClubsResponse>
	createSavedClub: (req: CreateSavedClubRequest) => Promise<void>
	removeSavedClub: (req: RemoveSavedClubRequest) => Promise<void>
	listMyClubs: () => Promise<ListMyClubsResponse>
	listRandomRecommendations: () => Promise<ListRandomRecommendationsResponse>
}

type Deps = {
	repositories: [ClubRepository]
}

export const getClubService = ({ repositories }: Deps): ClubService => ({
	searchClubs: (req, signal) => repositories[0].searchClubs(req, signal),
	listPopularClubs: () => repositories[0].listPopularClubs(),
	listLatestClubs: () => repositories[0].listLatestClubs(),
	listClubs: req => repositories[0].listClubs(req),
	getClub: req => repositories[0].getClub(req),
	getManagedClubDetail: req => repositories[0].getManagedClubDetail(req),
	listManageClubs: () => repositories[0].listManageClubs(),
	listClubRankings: req => repositories[0].listClubRankings(req),
	requestClubManager: req => repositories[0].requestClubManager(req),
	listSavedClubs: () => repositories[0].listSavedClubs(),
	createSavedClub: req => repositories[0].createSavedClub(req),
	removeSavedClub: req => repositories[0].removeSavedClub(req),
	listMyClubs: () => repositories[0].listMyClubs(),
	listRandomRecommendations: () => repositories[0].listRandomRecommendations(),
})
