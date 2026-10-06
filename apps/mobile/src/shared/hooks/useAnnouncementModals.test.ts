import useAnnouncementModals from "@/shared/hooks/useAnnouncementModals";

const mockSetModalQueue = jest.fn();
const mockSetHasInitializedAnnouncements = jest.fn();
let mockEffectDependencies: readonly unknown[] | undefined;
let mockStateCallCount = 0;

jest.mock("react", () => {
	const actual = jest.requireActual("react");

	return {
		...actual,
		useContext: () => ({
			announcementService: {
				listAnnouncements: jest.fn(),
				dismissAnnouncements: jest.fn(),
			},
		}),
		useEffect: (effect: () => void, dependencies: readonly unknown[]) => {
			const dependenciesChanged =
				!mockEffectDependencies ||
				dependencies.some(
					(dependency, index) =>
						!Object.is(dependency, mockEffectDependencies?.[index]),
				);

			mockEffectDependencies = dependencies;
			if (dependenciesChanged) effect();
		},
		useState: (initialValue: unknown) => {
			const setter =
				mockStateCallCount % 2 === 0
					? mockSetModalQueue
					: mockSetHasInitializedAnnouncements;
			mockStateCallCount += 1;
			return [initialValue, setter];
		},
	};
});

jest.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ mutate: jest.fn() }),
	useQuery: () => ({
		data: undefined,
		isError: false,
		isSuccess: false,
	}),
	useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

describe("useAnnouncementModals", () => {
	beforeEach(() => {
		mockSetModalQueue.mockClear();
		mockSetHasInitializedAnnouncements.mockClear();
		mockEffectDependencies = undefined;
		mockStateCallCount = 0;
	});

	it("does not reset state again when the disabled hook rerenders", () => {
		useAnnouncementModals(false);
		useAnnouncementModals(false);

		expect(mockSetModalQueue).toHaveBeenCalledTimes(1);
		expect(mockSetHasInitializedAnnouncements).toHaveBeenCalledTimes(1);
	});
});
