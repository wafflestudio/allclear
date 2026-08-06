export const MAX_ACTIVITY_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const isActivityImageFileSizeAllowed = (
	fileSize: number | undefined,
): boolean =>
	fileSize === undefined ||
	(Number.isFinite(fileSize) &&
		fileSize >= 0 &&
		fileSize <= MAX_ACTIVITY_IMAGE_FILE_SIZE_BYTES);
