import type { User } from "@/entities/user";

type SavedProfile = {
	nickname: string;
	collegeMajorId: number;
	college: string;
	major: string;
	admissionClass: number;
};

export const buildUpdatedProfile = (
	user: User,
	profile: SavedProfile,
): User => ({
	...user,
	nickname: profile.nickname,
	collegeMajor: {
		id: profile.collegeMajorId,
		college: profile.college,
		major: profile.major,
	},
	admissionClass: profile.admissionClass,
});
