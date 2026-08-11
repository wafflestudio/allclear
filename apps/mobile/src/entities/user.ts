export type User = {
	id: string;
	nickname: string;
	name: string;
	phone: string;
	email: string;
	gender: string;
	birthDate: string | null;
	birthYear: string;
	collegeMajor: CollegeMajor | null;
	// 학번
	admissionClass: number | null;
	// 학년
	grade: number | null;
};

export type CollegeMajor = {
	id: number;
	college: string | null;
	major: string | null;
};
