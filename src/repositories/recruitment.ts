import { apiConnector } from '@/shared/utils/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegularMeetingPayload = {
	day_of_week: string
	start_time: string
	end_time: string
}

export type RecruitmentSummary = {
	id: number
	display_title: string
	title: string
	deadline: string
	is_active: boolean
}

type ListClubRecruitmentsApiResponse = {
	success: boolean
	message: string
	data: {
		club_name: string
		recruitments: RecruitmentSummary[]
	}
}

export type ListClubRecruitmentsRequest = {
	clubId: string
}

export type ListClubRecruitmentsResponse = {
	club_name: string
	recruitments: RecruitmentSummary[]
}

export type CreateRecruitmentRequest = {
	clubId: string
	title: string
	deadline: string
	is_mandatory: boolean
	has_regular_meeting: boolean
	regular_meetings: RegularMeetingPayload[]
	activity_location_type: string
	activity_location_text: string
	has_eligibility: boolean
	eligibility_text: string
	has_capacity_limit: boolean
	capacity_limit_text: string
	has_membership_fee: boolean
	membership_fee_text: string
	application_url: string
	application_process: string
	full_recruitment_text: string
	image_urls: string[]
}

export type CreateRecruitmentResponse = {
	id: string
}

export type UploadRecruitmentImageRequest = {
	clubId: string
	uri: string
	type: string
	name: string
}

export type UploadRecruitmentImageResponse = {
	url: string
}

export type DeleteRecruitmentRequest = {
	recruitmentId: number
}

export type RecruitmentContent = {
	title: string
	deadline: string
	is_mandatory: boolean
	has_regular_meeting: boolean
	regular_meetings: RegularMeetingPayload[]
	activity_location_type: string
	activity_location_text: string
	has_eligibility: boolean
	eligibility_text: string
	has_capacity_limit: boolean
	capacity_limit_text: string
	has_membership_fee: boolean
	membership_fee_text: string
	application_url: string
	application_process: string
	full_recruitment_text: string | null
	image_urls: string[]
}

export type GetRecruitmentDetailRequest = {
	recruitmentId: number
}

type GetRecruitmentDetailApiResponse = {
	success: boolean
	data: {
		id: number
		display_title: string
		club_id: string
		content: RecruitmentContent
	}
}

export type GetRecruitmentDetailResponse = {
	id: number
	display_title: string
	club_id: string
	content: RecruitmentContent
}

export type UpdateRecruitmentRequest = {
	recruitmentId: number
} & Omit<CreateRecruitmentRequest, 'clubId'>

export type RecruitmentRepository = {
	listClubRecruitments: (req: ListClubRecruitmentsRequest) => Promise<ListClubRecruitmentsResponse>
	createRecruitment: (req: CreateRecruitmentRequest) => Promise<CreateRecruitmentResponse>
	uploadRecruitmentImage: (
		req: UploadRecruitmentImageRequest,
	) => Promise<UploadRecruitmentImageResponse>
	deleteRecruitment: (req: DeleteRecruitmentRequest) => Promise<void>
	getRecruitmentDetail: (req: GetRecruitmentDetailRequest) => Promise<GetRecruitmentDetailResponse>
	updateRecruitment: (req: UpdateRecruitmentRequest) => Promise<void>
}

// ─── Implementation ───────────────────────────────────────────────────────────

export const getRecruitmentRepository = (): RecruitmentRepository => ({
	listClubRecruitments: async req => {
		const res = await apiConnector.get<ListClubRecruitmentsApiResponse>(
			`/v2/clubs/${req.clubId}/recruitments`,
		)
		return {
			club_name: res.data.club_name,
			recruitments: res.data.recruitments,
		}
	},

	createRecruitment: async req => {
		const { clubId, ...body } = req
		return apiConnector.post<CreateRecruitmentResponse>(
			`/v2/managers/me/clubs/${clubId}/recruitments`,
			body,
		)
	},

	deleteRecruitment: async req => {
		await apiConnector.delete<void>(`/v2/managers/me/recruitments/${req.recruitmentId}`)
	},

	getRecruitmentDetail: async req => {
		const res = await apiConnector.get<GetRecruitmentDetailApiResponse>(
			`/v2/recruitments/${req.recruitmentId}`,
		)
		return res.data
	},

	updateRecruitment: async req => {
		const { recruitmentId, ...body } = req
		await apiConnector.patch<void>(`/v2/managers/me/recruitments/${recruitmentId}`, body)
	},

	uploadRecruitmentImage: async req => {
		const formData = new FormData()
		formData.append('file', {
			uri: req.uri,
			type: req.type,
			name: req.name,
		} as unknown as Blob)

		return apiConnector.post<UploadRecruitmentImageResponse>(
			`/v2/managers/me/clubs/${req.clubId}/recruitments/images`,
			formData as unknown as object,
			{ timeout: 60000, headers: { 'Content-Type': 'multipart/form-data' } },
		)
	},
})
