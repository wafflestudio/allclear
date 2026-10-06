import type { UserNotification } from "@/entities/userNotification";
import { getUserNotificationContent } from "@/features/mypage/utils/userNotification";

const transferNotification: UserNotification = {
	id: "10",
	type: "MANAGER_TRANSFER_COMPLETED",
	clubId: "4dfcd19f-9f20-4128-8b4c-b76deab4b65d",
	sourceType: "MANAGER_TRANSFER",
	sourceId: "12",
	metadata: { clubName: "와플스튜디오" },
	readAt: null,
	createdAt: "2026-08-24T00:00:00.000Z",
};

describe("user notification content", () => {
	it("기존 관리자에게 권한 이전 완료와 접근 종료를 안내한다", () => {
		expect(getUserNotificationContent(transferNotification, [])).toEqual({
			title: "권한이 정상적으로 이전됐어요.",
			description:
				"‘와플스튜디오’ 동아리의 관리자 권한이 이전됐어요.\n이제 동아리 관리 기능에 접속할 수 없어요.",
			buttonLabel: "확인",
		});
	});

	it("동아리 이름이 없어도 민감한 식별자 없이 완료를 안내한다", () => {
		expect(
			getUserNotificationContent(
				{ ...transferNotification, metadata: null },
				[],
			).description,
		).toBe(
			"관리자 권한이 이전됐어요.\n이제 동아리 관리 기능에 접속할 수 없어요.",
		);
	});
});
