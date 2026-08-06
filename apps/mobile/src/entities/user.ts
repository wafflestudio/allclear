export type User = {
	id: string;
	nickname: string;
	name: string;
	phone: string;
	email: string;
	gender: string;
	birthDate: string | null;
	birthYear: string;
	// 단과대
	college: string;
	// 학과
	major: string;
	// 단과대+학번 (위 2개 필드를 override)
	collegeMajorId: number;
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
