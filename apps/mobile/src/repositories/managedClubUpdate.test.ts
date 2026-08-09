import { buildManagedClubUpdateBody } from "@/repositories/managedClubUpdate";

describe("buildManagedClubUpdateBody", () => {
	it("동아리 변경 필드만 club_data에 담는다", () => {
		expect(buildManagedClubUpdateBody({ name: "수정된 동아리명" })).toEqual({
			club_data: { name: "수정된 동아리명" },
		});
	});

	it("운영진 변경 필드만 manager_data에 담고 studentId를 변환한다", () => {
		expect(
			buildManagedClubUpdateBody(
				{},
				{ phone: "010-9876-5432", studentId: "2022-12345" },
			),
		).toEqual({
			manager_data: {
				phone: "010-9876-5432",
				student_id: "2022-12345",
			},
		});
	});

	it("동아리와 운영진 변경 필드를 한 요청에 담는다", () => {
		expect(
			buildManagedClubUpdateBody(
				{ category: "학술" },
				{ name: "홍길동", phone: "010-9876-5432" },
			),
		).toEqual({
			club_data: { category: "학술" },
			manager_data: {
				name: "홍길동",
				phone: "010-9876-5432",
			},
		});
	});

	it("변경 필드가 하나도 없으면 요청 생성을 막는다", () => {
		expect(() => buildManagedClubUpdateBody({}, {})).toThrow(
			"At least one managed club field is required",
		);
	});

	it("재신청은 변경 필드 없이 resubmit만 담을 수 있다", () => {
		expect(buildManagedClubUpdateBody({}, undefined, true)).toEqual({
			resubmit: true,
		});
	});
});
