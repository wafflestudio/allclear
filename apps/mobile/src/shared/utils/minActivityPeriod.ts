export type MinActivityPeriodMode = "none" | "number";

type MinActivityPeriodState = {
	mode: MinActivityPeriodMode;
	value: string;
};

export const incrementMinActivityPeriodValue = (
	currentSemesters: number,
): MinActivityPeriodState => ({
	mode: "number",
	value: String(currentSemesters + 1),
});

export const decrementMinActivityPeriodValue = (
	currentSemesters: number,
): MinActivityPeriodState =>
	currentSemesters > 1
		? {
				mode: "number",
				value: String(currentSemesters - 1),
			}
		: {
				mode: "none",
				value: "",
			};
