export type ActivityCycleMode = "none" | "number";

type ActivityCycleState = {
	mode: ActivityCycleMode;
	value: string;
};

export const incrementActivityCycleValue = (
	currentSemesters: number,
): ActivityCycleState => ({
	mode: "number",
	value: String(currentSemesters + 1),
});

export const decrementActivityCycleValue = (
	currentSemesters: number,
): ActivityCycleState =>
	currentSemesters > 1
		? {
				mode: "number",
				value: String(currentSemesters - 1),
			}
		: {
				mode: "none",
				value: "",
			};
