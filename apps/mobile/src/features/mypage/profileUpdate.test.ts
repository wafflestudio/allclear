import type { User } from "@/entities/user";
import { buildUpdatedProfile } from "@/features/mypage/profileUpdate";

describe("buildUpdatedProfile", () => {
	it("reflects the saved college and major in the local profile immediately", () => {
		const user: User = {
			id: "user-id",
			nickname: "기존 닉네임",
			name: "홍길동",
			phone: "01012345678",
			email: "user@example.com",
			collegeMajor: {
				id: 1,
				college: "공과대학",
				major: "컴퓨터공학부",
			},
			admissionClass: 23,
		};

		expect(
			buildUpdatedProfile(user, {
				nickname: "새 닉네임",
				collegeMajorId: 2,
				college: "인문대학",
				major: "국어국문학과",
				admissionClass: 24,
			}),
		).toEqual({
			...user,
			nickname: "새 닉네임",
			collegeMajor: {
				id: 2,
				college: "인문대학",
				major: "국어국문학과",
			},
			admissionClass: 24,
		});
	});
});
