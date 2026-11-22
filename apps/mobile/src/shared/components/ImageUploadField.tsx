import React from "react";
import {
	Pressable,
	ScrollView,
	type StyleProp,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialIcons";
import ImagePickerTile from "@/shared/components/ImagePickerTile";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import type { EditableImage } from "@/shared/types/image";
import { ms, s, vs } from "@/shared/utils/scale";

type Props = {
	title: string;
	description?: string;
	images: EditableImage[];
	onChange: (images: EditableImage[]) => void;
	maxCount: number;
	emptyMessage?: string;
	errorTitle?: string;
	fileNamePrefix?: string;
	tileSize?: number;
	tileStyle?: StyleProp<ViewStyle>;
	isFileSizeAllowed?: (fileSize: number | undefined) => boolean;
	onRejectedFiles?: (count: number) => void;
};

const ImageUploadField = ({
	title,
	description,
	images,
	onChange,
	maxCount,
	emptyMessage,
	errorTitle = "이미지를 불러오지 못했어요",
	fileNamePrefix = "image",
	tileSize,
	tileStyle,
	isFileSizeAllowed = () => true,
	onRejectedFiles,
}: Props) => {
	const isSingleImage = maxCount === 1;
	const remainingCount = Math.max(0, maxCount - images.length);
	const resolvedTileSize = tileSize ?? s(isSingleImage ? 150 : 104);

	const handleAddImages = async () => {
		if (!isSingleImage && remainingCount <= 0) return;

		const result = await launchImageLibrary({
			mediaType: "photo",
			selectionLimit: isSingleImage ? 1 : remainingCount,
			includeBase64: false,
		});

		if (result.didCancel) return;
		if (result.errorCode) {
			Toast.show({
				type: "error",
				text1: errorTitle,
				text2: result.errorMessage,
				position: "top",
				topOffset: 60,
				visibilityTime: 2000,
			});
			return;
		}

		const assets = result.assets ?? [];
		const rejectedCount = assets.filter(
			(asset) => !isFileSizeAllowed(asset.fileSize),
		).length;
		const selectedImages: EditableImage[] = [];
		assets.forEach((asset, index) => {
			if (!isFileSizeAllowed(asset.fileSize) || !asset.uri) return;
			const id = `local-${Date.now()}-${index}`;
			const name =
				asset.fileName ?? `${fileNamePrefix}_${Date.now()}_${index}.jpg`;
			selectedImages.push({
				id,
				uri: asset.uri,
				file: {
					uri: asset.uri,
					type: asset.type ?? "image/jpeg",
					name,
				},
			});
		});

		if (rejectedCount > 0) onRejectedFiles?.(rejectedCount);
		if (selectedImages.length === 0) return;

		const nextImages = isSingleImage
			? selectedImages.slice(0, 1)
			: [...images, ...selectedImages].slice(0, maxCount);
		onChange(nextImages);
	};

	const renderSingleImage = () => (
		<ImagePickerTile
			imageUri={images[0]?.uri}
			onPress={handleAddImages}
			accessibilityLabel={`${title} 선택`}
			style={[
				styles.singleTile,
				{ width: resolvedTileSize, height: resolvedTileSize },
				tileStyle,
			]}
			imageStyle={styles.singleImage}
		/>
	);

	const renderMultipleImages = () => (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.list}
		>
			{images.map((image) => (
				<View
					key={image.id}
					style={[
						styles.imageWrapper,
						{ width: resolvedTileSize, height: resolvedTileSize },
					]}
				>
					<ImagePickerTile
						imageUri={image.uri}
						style={[
							styles.imageTile,
							{ width: resolvedTileSize, height: resolvedTileSize },
							tileStyle,
						]}
						imageStyle={styles.multipleImage}
					/>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={`${title} 삭제`}
						style={styles.removeButton}
						onPress={() =>
							onChange(images.filter((item) => item.id !== image.id))
						}
					>
						<Icon name="close" size={ms(16)} color={Colors.WHITE} />
					</Pressable>
				</View>
			))}
			{remainingCount > 0 && (
				<ImagePickerTile
					accessibilityLabel={`${title} 추가`}
					style={[
						styles.addTile,
						{ width: resolvedTileSize, height: resolvedTileSize },
						tileStyle,
					]}
					onPress={handleAddImages}
				>
					<Icon name="add" size={ms(28)} color={Colors.BODYTEXT_DISABLED} />
					<Text style={styles.addText}>사진 추가</Text>
				</ImagePickerTile>
			)}
		</ScrollView>
	);

	return (
		<View style={styles.wrapper}>
			<View style={styles.labelRow}>
				<Text style={styles.label}>{title}</Text>
				{!isSingleImage && (
					<Text style={styles.count}>
						{images.length}/{maxCount}
					</Text>
				)}
			</View>
			{description ? (
				<Text style={styles.description}>{description}</Text>
			) : null}
			{isSingleImage ? renderSingleImage() : renderMultipleImages()}
			{images.length === 0 && emptyMessage ? (
				<Text style={styles.emptyMessage}>{emptyMessage}</Text>
			) : null}
		</View>
	);
};

export default React.memo(ImageUploadField);

const styles = StyleSheet.create({
	wrapper: { gap: vs(8) },
	labelRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	label: { ...typography.headerXLSemibold, color: Colors.BODYTEXT_SUB },
	count: { ...typography.bodySRegular, color: Colors.BODYTEXT_SUB_2 },
	description: { ...typography.bodySRegular, color: Colors.BODYTEXT_SUB },
	list: { gap: s(10), paddingVertical: vs(4) },
	imageWrapper: {},
	imageTile: { overflow: "hidden", borderRadius: s(10) },
	multipleImage: { borderRadius: s(10) },
	removeButton: {
		position: "absolute",
		top: s(4),
		right: s(4),
		width: ms(28),
		height: ms(28),
		borderRadius: ms(14),
		backgroundColor: Colors.BODYTEXT_MAIN,
		alignItems: "center",
		justifyContent: "center",
	},
	addTile: {
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: s(10),
		alignItems: "center",
		justifyContent: "center",
		gap: vs(4),
	},
	addText: { ...typography.bodySRegular, color: Colors.BODYTEXT_SUB },
	singleTile: {
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: s(12),
		backgroundColor: Colors.WHITE,
		justifyContent: "center",
		alignItems: "center",
	},
	singleImage: { borderRadius: s(11) },
	emptyMessage: { ...typography.bodyMRegular, color: Colors.POINTCOLOR },
});
