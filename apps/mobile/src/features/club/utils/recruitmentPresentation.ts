import type { RecruitmentRegularMeeting } from "@/repositories/recruitment";
import { normalizeUrl } from "@/shared/utils/clubSns";

const KOREA_TIME_OFFSET_MS = 9 * 60 * 60 * 1000;

export type RecruitmentDeadlineFormFields = {
	year: string;
	month: string;
	day: string;
	hour: string;
	minute: string;
};

const getKoreanDateParts = (value: string | Date) => {
	const koreanDate = new Date(new Date(value).getTime() + KOREA_TIME_OFFSET_MS);

	return {
		year: koreanDate.getUTCFullYear(),
		month: koreanDate.getUTCMonth() + 1,
		day: koreanDate.getUTCDate(),
		hour: koreanDate.getUTCHours(),
		minute: koreanDate.getUTCMinutes(),
	};
};

const padTwoDigits = (value: number): string => String(value).padStart(2, "0");

export const formatRecruitmentDeadline = (deadline: string): string => {
	const deadlineParts = getKoreanDateParts(deadline);
	const year = String(deadlineParts.year).slice(-2);

	return `${year}.${padTwoDigits(deadlineParts.month)}.${padTwoDigits(
		deadlineParts.day,
	)} 모집마감`;
};

export const getRecruitmentDeadlineRequestValue = ({
	year,
	month,
	day,
	hour,
	minute,
}: RecruitmentDeadlineFormFields): string =>
	new Date(
		Date.UTC(
			Number(year),
			Number(month) - 1,
			Number(day),
			Number(hour) - 9,
			Number(minute),
		),
	).toISOString();

export const getRecruitmentDeadlineFormFields = (
	deadline: string,
): RecruitmentDeadlineFormFields => {
	const parts = getKoreanDateParts(deadline);

	return {
		year: String(parts.year),
		month: padTwoDigits(parts.month),
		day: padTwoDigits(parts.day),
		hour: padTwoDigits(parts.hour),
		minute: padTwoDigits(parts.minute),
	};
};

export const shouldStackRegularMeetings = (meetingCount: number): boolean =>
	meetingCount >= 2;

export const shouldStackActivityLocation = (location: string): boolean =>
	Array.from(location.trim()).length >= 10;

const formatTime = (time: string | null): string =>
	time?.slice(0, 5).replace(/^0/, "") ?? "";

export const formatRegularMeeting = (
	meeting: RecruitmentRegularMeeting,
): string => {
	const day = meeting.day_of_week.endsWith("요일")
		? meeting.day_of_week
		: `${meeting.day_of_week}요일`;
	const startTime = formatTime(meeting.start_time);
	const endTime = formatTime(meeting.end_time);
	const time = [startTime, endTime].filter(Boolean).join("~");

	return time ? `${day} ${time}` : day;
};

export const getRecruitmentTextPreview = (html: string): string =>
	html
		.replace(/<br\s*\/?>/gi, " ")
		.replace(/<\/(?:div|h[1-6]|li|p)>/gi, " ")
		.replace(/<[^>]*>/g, "")
		.replace(/&nbsp;|&#160;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;|&apos;/gi, "'")
		.replace(/\s+/g, " ")
		.trim();

export const getNextExpandedRecruitmentId = (
	currentId: number | null,
	pressedId: number,
): number | null => (currentId === pressedId ? null : pressedId);

export const getRecruitmentApplicationUrl = (applicationUrl: string): string =>
	normalizeUrl(applicationUrl);

export const getRecruitmentApplicationRequestFields = (
	applicationUrl: string,
): { application_url: string } => ({
	application_url: getRecruitmentApplicationUrl(applicationUrl),
});
