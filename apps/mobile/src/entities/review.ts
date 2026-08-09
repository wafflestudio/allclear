export type ReviewKeywordCategory = {
	id: number;
	title: string;
	color: string; // hex
	keywords: ReviewKeyword[];
};

export type ReviewKeyword = {
	id: string;
	title: string;
	color: string; // hex
	iconUri: string; // unused
};
