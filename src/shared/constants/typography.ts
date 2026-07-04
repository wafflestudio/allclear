import { TextStyle } from 'react-native'
import { ms, vs } from '@/shared/utils/scale'

type FontWeight = '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'

const fontFamilyByWeight: Record<FontWeight, string> = {
	'100': 'Pretendard-Thin',
	'200': 'Pretendard-ExtraLight',
	'300': 'Pretendard-Light',
	'400': 'Pretendard-Regular',
	'500': 'Pretendard-Medium',
	'600': 'Pretendard-SemiBold',
	'700': 'Pretendard-Bold',
	'800': 'Pretendard-ExtraBold',
	'900': 'Pretendard-Black',
}

const base = (fontSize: number, fontWeight: FontWeight, lineHeight?: number): TextStyle => ({
	fontFamily: fontFamilyByWeight[fontWeight],
	fontSize: ms(fontSize),
	...(lineHeight ? { lineHeight: vs(lineHeight) } : {}),
})

export const typography = {
	// Header
	headerXXLSemibold: base(25, '600'),
	headerXL: base(20, '700'),
	headerL: base(16, '600'),
	headerXXL: base(25, '700', 30),
	headerXLSemibold: base(20, '600', 24),
	// Body
	bodyXSRegular: base(10, '400'),
	bodyXSSemibold: base(10, '600', 14),
	bodySRegular: base(12, '400', 18),
	bodySMedium: base(12, '500'),
	bodySSemibold: base(12, '600', 14),
	bodySSmallSemibold: base(11, '600', 14),
	bodySSmallMedium: base(11, '500', 14),
	bodyMRegular: base(14, '400'),
	bodyMSemibold: base(14, '600'),
	bodyMMedium: base(14, '500'),
	bodyMMedium13px: base(13, '500'),
}
