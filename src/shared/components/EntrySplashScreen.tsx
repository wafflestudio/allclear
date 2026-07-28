import React, { useCallback, useEffect, useState } from 'react'
import { StatusBar, StyleSheet, useWindowDimensions } from 'react-native'
import Animated, {
	Easing,
	runOnJS,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withSequence,
	withTiming,
} from 'react-native-reanimated'
import EntryLoginActions from '@/shared/components/EntryLoginActions'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { useProfile } from '@/shared/contexts/profileContext'
import useEntrySplashAnimatedStyles from '@/shared/hooks/useEntrySplashAnimatedStyles'
import useLoginActions from '@/shared/hooks/useLoginActions'
import {
	ENTRY_SPLASH_HOLD_MS,
	ENTRY_SPLASH_TRANSITION_MS,
	getEntrySplashStages,
} from '@/shared/utils/entrySplash'

const DESIGN_WIDTH = 402
const DESIGN_HEIGHT = 874
const FIGMA_EASE_OUT = Easing.bezier(0, 0, 0.58, 1)

const symbolSource = require('@/assets/images/brand/entry-symbol.png') as number
const smallWordmarkSource = require('@/assets/images/brand/entry-wordmark-small.png') as number
const transitionWordmarkSource =
	require('@/assets/images/brand/entry-wordmark-transition.png') as number
const wordmarkSource = require('@/assets/images/brand/entry-wordmark.png') as number

type Props = {
	active: boolean
	onComplete: () => void
}

const EntrySplashScreen = ({ active, onComplete }: Props) => {
	const { width, height } = useWindowDimensions()
	const { user, isLoading: isProfileLoading } = useProfile()
	const reduceMotion = useReducedMotion()
	const introProgress = useSharedValue(0)
	const loginProgress = useSharedValue(0)
	const screenOpacity = useSharedValue(1)
	const [brandRevealComplete, setBrandRevealComplete] = useState(false)
	const [loginReady, setLoginReady] = useState(false)
	const [finished, setFinished] = useState(false)
	const { isLoading, onAppleButtonPress, onKakaoButtonPress } = useLoginActions()
	const shouldShowLogin = getEntrySplashStages(Boolean(user)).includes(4)

	const scaleX = width / DESIGN_WIDTH
	const scaleY = height / DESIGN_HEIGHT

	const {
		screenStyle,
		smallWordmarkStyle,
		symbolStyle,
		taglineLayoutStyle,
		taglineStyle,
		transitionWordmarkStyle,
		visualProgress,
		wordmarkStyle,
	} = useEntrySplashAnimatedStyles({
		introProgress,
		loginProgress,
		scaleX,
		scaleY,
		screenOpacity,
	})
	const markBrandRevealComplete = useCallback(() => setBrandRevealComplete(true), [])
	const markLoginReady = useCallback(() => setLoginReady(true), [])
	const finishEntry = useCallback(() => {
		setFinished(true)
		onComplete()
	}, [onComplete])

	useEffect(() => {
		if (!active) return

		if (reduceMotion) {
			introProgress.value = 2
			setBrandRevealComplete(true)
			return
		}

		introProgress.value = withSequence(
			withDelay(
				ENTRY_SPLASH_HOLD_MS,
				withTiming(1, {
					duration: ENTRY_SPLASH_TRANSITION_MS,
					easing: FIGMA_EASE_OUT,
				}),
			),
			withDelay(
				ENTRY_SPLASH_HOLD_MS,
				withTiming(
					2,
					{
						duration: ENTRY_SPLASH_TRANSITION_MS,
						easing: FIGMA_EASE_OUT,
					},
					completed => {
						if (completed) runOnJS(markBrandRevealComplete)()
					},
				),
			),
		)
	}, [active, introProgress, markBrandRevealComplete, reduceMotion])

	useEffect(() => {
		if (!active || !brandRevealComplete || isProfileLoading || finished) return

		if (!shouldShowLogin) {
			const exitDelay = reduceMotion || loginReady ? 0 : ENTRY_SPLASH_HOLD_MS
			screenOpacity.value = withDelay(
				exitDelay,
				withTiming(
					0,
					{
						duration: reduceMotion ? 0 : ENTRY_SPLASH_TRANSITION_MS,
						easing: FIGMA_EASE_OUT,
					},
					completed => {
						if (completed) runOnJS(finishEntry)()
					},
				),
			)
			return
		}

		if (loginReady) return

		if (reduceMotion) {
			loginProgress.value = 1
			setLoginReady(true)
			return
		}

		loginProgress.value = withDelay(
			ENTRY_SPLASH_HOLD_MS,
			withTiming(
				1,
				{
					duration: ENTRY_SPLASH_TRANSITION_MS,
					easing: FIGMA_EASE_OUT,
				},
				completed => {
					if (completed) runOnJS(markLoginReady)()
				},
			),
		)
	}, [
		active,
		brandRevealComplete,
		finishEntry,
		finished,
		isProfileLoading,
		loginReady,
		loginProgress,
		markLoginReady,
		reduceMotion,
		screenOpacity,
		shouldShowLogin,
	])

	return (
		<Animated.View style={[styles.screen, screenStyle]}>
			<StatusBar barStyle="dark-content" backgroundColor={Colors.WHITE} />
			<Animated.Text style={[styles.tagline, taglineLayoutStyle, taglineStyle]}>
				이번 학기엔 동아리까지,
			</Animated.Text>
			<Animated.Image source={symbolSource} style={[styles.brandAsset, symbolStyle]} />
			<Animated.Image
				source={smallWordmarkSource}
				style={[styles.brandAsset, smallWordmarkStyle]}
			/>
			<Animated.Image
				source={transitionWordmarkSource}
				style={[styles.brandAsset, transitionWordmarkStyle]}
			/>
			<Animated.Image source={wordmarkSource} style={[styles.brandAsset, wordmarkStyle]} />

			<EntryLoginActions
				isLoading={isLoading}
				isReady={loginReady}
				onAppleButtonPress={onAppleButtonPress}
				onKakaoButtonPress={onKakaoButtonPress}
				scaleX={scaleX}
				scaleY={scaleY}
				visualProgress={visualProgress}
			/>
		</Animated.View>
	)
}

export default EntrySplashScreen

const styles = StyleSheet.create({
	screen: {
		...StyleSheet.absoluteFillObject,
		zIndex: 100,
		backgroundColor: Colors.WHITE,
	},
	brandAsset: {
		position: 'absolute',
		resizeMode: 'contain',
	},
	tagline: {
		position: 'absolute',
		...typography.headerL,
		color: Colors.POINTCOLOR,
	},
})
