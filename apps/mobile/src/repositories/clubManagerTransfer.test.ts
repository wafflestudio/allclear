import { getClubRepository } from "@/repositories/club";
import { apiConnector } from "@/shared/utils/api";

jest.mock("@/shared/utils/api", () => ({
	apiConnector: {
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
	},
}));

const mockedApiConnector = apiConnector as jest.Mocked<typeof apiConnector>;
const clubId = "4dfcd19f-9f20-4128-8b4c-b76deab4b65d";
const token = "a".repeat(43);

describe("club manager transfer repository", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("관리자가 이전 링크를 발급한다", async () => {
		mockedApiConnector.post.mockResolvedValue({
			success: true,
			message: "관리자 권한 이전 링크를 만들었어요.",
			data: {
				transfer_url: `https://all-clear.cc/manager-transfer/${token}`,
				expires_at: "2026-08-27T00:00:00.000Z",
			},
		});

		await expect(
			getClubRepository().createManagerTransferInvitation({ clubId }),
		).resolves.toEqual({
			transferUrl: `https://all-clear.cc/manager-transfer/${token}`,
			expiresAt: "2026-08-27T00:00:00.000Z",
		});
		expect(mockedApiConnector.post).toHaveBeenCalledWith(
			`/v2/managers/me/clubs/${clubId}/manager-transfer-invitations`,
		);
	});

	it("수신자가 이전 초대 정보를 조회한다", async () => {
		mockedApiConnector.get.mockResolvedValue({
			success: true,
			message: "관리자 권한 이전 초대를 조회했어요.",
			data: {
				club_uuid: clubId,
				club_name: "와플스튜디오",
				expires_at: "2026-08-27T00:00:00.000Z",
			},
		});

		await expect(
			getClubRepository().getManagerTransferInvitation({ token }),
		).resolves.toEqual({
			clubId,
			clubName: "와플스튜디오",
			expiresAt: "2026-08-27T00:00:00.000Z",
		});
		expect(mockedApiConnector.get).toHaveBeenCalledWith(
			`/v2/manager-transfer-invitations/${token}`,
		);
	});

	it("수신자가 권한 이전을 수락한다", async () => {
		mockedApiConnector.put.mockResolvedValue({
			success: true,
			message: "관리자 권한을 이전받았어요.",
			data: {
				club_uuid: clubId,
				club_name: "와플스튜디오",
			},
		});

		await expect(
			getClubRepository().acceptManagerTransferInvitation({ token }),
		).resolves.toEqual({ clubId, clubName: "와플스튜디오" });
		expect(mockedApiConnector.put).toHaveBeenCalledWith(
			`/v2/manager-transfer-invitations/${token}/acceptance`,
		);
	});
});
