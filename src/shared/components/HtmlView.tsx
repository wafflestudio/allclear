import { useCallback, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import RenderHtml, { MixedStyleDeclaration, RenderHTMLProps } from 'react-native-render-html'
import { Colors } from '../constants/colors'
import { typography } from '../constants/typography'

type Props = Partial<RenderHTMLProps> & {
	html: string
}

const BASE_STYLE: MixedStyleDeclaration = {
	flexWrap: 'wrap',
	whiteSpace: 'pre',
	color: Colors.BODYTEXT_SUB,
	...(typography.bodySRegular as MixedStyleDeclaration),
}

const TAG_STYLES = {
	p: {
		marginTop: 0,
		marginBottom: 0,
		paddingTop: 0,
		paddingBottom: 0,
	},
}

const HtmlView = ({ html, contentWidth, ...props }: Props) => {
	const [measuredWidth, setMeasuredWidth] = useState(0)
	const onLayout = useCallback((e: LayoutChangeEvent) => {
		setMeasuredWidth(e.nativeEvent.layout.width)
	}, [])
	const resolvedWidth = contentWidth ?? measuredWidth

	return (
		<View onLayout={onLayout}>
			{resolvedWidth > 0 && (
				<RenderHtml
					{...props}
					contentWidth={resolvedWidth}
					baseStyle={BASE_STYLE}
					source={{ html: html.replace(/<br \/>\n/g, '\n') }}
					tagsStyles={TAG_STYLES}
				/>
			)}
		</View>
	)
}

export default HtmlView
