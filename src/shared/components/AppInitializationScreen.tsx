import React, { useMemo } from 'react'
import { Image, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'

const DESIGN_WIDTH = 402
const DESIGN_HEIGHT = 874

const symbolSource = require('@/assets/images/brand/entry-symbol-white.png') as number
const wordmarkSource = require('@/assets/images/brand/entry-wordmark-small.png') as number

const AppInitializationScreen = () => {
	const { width, height } = useWindowDimensions()
	const scaleX = width / DESIGN_WIDTH
	const scaleY = height / DESIGN_HEIGHT

	const layoutStyles = useMemo(
		() => ({
			symbol: {
				left: 160.556 * scaleX,
				top: 396.562 * scaleY,
				width: 80.906 * scaleX,
				height: 80.876 * scaleX,
			},
			tagline: {
				left: 117.556 * scaleX,
				top: 739 * scaleY,
				fontFamily: 'Pretendard-Bold',
				fontSize: 18 * scaleX,
				lineHeight: 30 * scaleX,
				letterSpacing: -0.36 * scaleX,
			},
			wordmark: {
				left: 164.556 * scaleX,
				top: 779 * scaleY,
				width: 72.497 * scaleX,
				height: 29.294 * scaleX,
			},
		}),
		[scaleX, scaleY],
	)

	return (
		<View
			accessible
			accessibilityRole="progressbar"
			accessibilityLabel="앱을 준비하고 있습니다"
			style={styles.screen}>
			<StatusBar barStyle="light-content" backgroundColor={Colors.POINTCOLOR} />
			<Image source={symbolSource} style={[styles.asset, layoutStyles.symbol]} />
			<Text style={[styles.tagline, layoutStyles.tagline]}>이번 학기엔 동아리까지,</Text>
			<Image
				source={wordmarkSource}
				style={[styles.asset, styles.wordmark, layoutStyles.wordmark]}
			/>
		</View>
	)
}

export default AppInitializationScreen

const styles = StyleSheet.create({
	screen: {
		...StyleSheet.absoluteFillObject,
		zIndex: 100,
		backgroundColor: Colors.POINTCOLOR,
	},
	asset: {
		position: 'absolute',
		resizeMode: 'contain',
	},
	tagline: {
		position: 'absolute',
		color: Colors.WHITE,
	},
	wordmark: {
		tintColor: Colors.WHITE,
	},
})
