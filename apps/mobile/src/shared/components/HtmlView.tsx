import { useCallback, useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import RenderHtml, {
	type MixedStyleDeclaration,
	type RenderHTMLProps,
} from "react-native-render-html";
import { Colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { vs } from "../utils/scale";

type Props = Partial<RenderHTMLProps> & {
	html: string;
};

const BASE_STYLE: MixedStyleDeclaration = {
	flexWrap: "wrap",
	whiteSpace: "pre",
	color: Colors.BODYTEXT_SUB,
	...(typography.bodySRegular as MixedStyleDeclaration),
};

const TAG_STYLES: Record<string, MixedStyleDeclaration> = {
	h1: {
		...(typography.headerXXL as MixedStyleDeclaration),
		marginTop: 0,
		marginBottom: vs(16),
	},
	h2: {
		...(typography.headerXL as MixedStyleDeclaration),
		lineHeight: vs(28),
		marginTop: vs(24),
		marginBottom: vs(12),
	},
	h3: {
		...(typography.headerL as MixedStyleDeclaration),
		lineHeight: vs(24),
		marginTop: vs(20),
		marginBottom: vs(8),
	},
	p: {
		marginTop: 0,
		marginBottom: 0,
		paddingTop: 0,
		paddingBottom: 0,
	},
};

const BLOCK_TAG_PATTERN = "h[1-6]|p|div|li|blockquote";

const normalizeHtml = (html: string) =>
	html
		.replace(
			new RegExp(
				`</(${BLOCK_TAG_PATTERN})>\\s+<(${BLOCK_TAG_PATTERN})(?=[\\s>])`,
				"gi",
			),
			"</$1><$2",
		)
		.replace(
			new RegExp(`<(${BLOCK_TAG_PATTERN})([^>]*)>\\s*\\n\\s*`, "gi"),
			"<$1$2>",
		)
		.replace(new RegExp(`\\s*\\n\\s*</(${BLOCK_TAG_PATTERN})>`, "gi"), "</$1>")
		.replace(/<br \/>\n/g, "\n");

const HtmlView = ({ html, contentWidth, baseStyle, ...props }: Props) => {
	const [measuredWidth, setMeasuredWidth] = useState(0);
	const onLayout = useCallback((e: LayoutChangeEvent) => {
		setMeasuredWidth(e.nativeEvent.layout.width);
	}, []);
	const resolvedWidth = contentWidth ?? measuredWidth;

	return (
		<View onLayout={onLayout}>
			{resolvedWidth > 0 && (
				<RenderHtml
					{...props}
					contentWidth={resolvedWidth}
					baseStyle={{ ...BASE_STYLE, ...baseStyle }}
					source={{ html: normalizeHtml(html) }}
					tagsStyles={TAG_STYLES}
				/>
			)}
		</View>
	);
};

export default HtmlView;
