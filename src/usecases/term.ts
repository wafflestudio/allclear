import { AgreeTermsRequest, ListTermsResponse, TermRepository } from '@/repositories/term'

export type TermService = {
	listTerms: () => Promise<ListTermsResponse>
	agreeTerms: (request: AgreeTermsRequest) => Promise<void>
}

type Deps = {
	repositories: [TermRepository]
}

export const getTermService = ({ repositories }: Deps): TermService => ({
	listTerms: repositories[0].listTerms,
	agreeTerms: repositories[0].agreeTerms,
})
