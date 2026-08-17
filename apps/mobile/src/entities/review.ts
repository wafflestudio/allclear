export type ReviewKeywordCategory = {
	id: number;
	title: string;
	keywords: ReviewKeyword[];
};

export type ReviewKeyword = {
	id: string;
	title: string;
	iconUri: string;
};
