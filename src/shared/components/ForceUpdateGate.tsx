import React, { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import AlertModal from '@/shared/components/AlertModal'
import AppInitializationScreen from '@/shared/components/AppInitializationScreen'
import EntrySplashScreen from '@/shared/components/EntrySplashScreen'
import { useProfile } from '@/shared/contexts/profileContext'
import useForceUpdateCheck from '@/shared/hooks/useForceUpdateCheck'
import {
	APP_INITIALIZATION_LOADING_DELAY_MS,
	shouldShowAppInitializationLoading,
} from '@/shared/utils/entrySplash'

const SPLASH_MIN_DURATION_MS = 1000

type Props = {
	children: React.ReactNode
	onEntryPresentationComplete: () => void
}

const ForceUpdateGate = ({ children, onEntryPresentationComplete }: Props) => {
	const state = useForceUpdateCheck()
	const { isLoading: isProfileLoading } = useProfile()
	const [minDelayElapsed, setMinDelayElapsed] = useState(false)
	const [initializationDelayElapsed, setInitializationDelayElapsed] = useState(false)
	const [splashHidden, setSplashHidden] = useState(false)
	const [entryComplete, setEntryComplete] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => setMinDelayElapsed(true), SPLASH_MIN_DURATION_MS)
		return () => clearTimeout(timer)
	}, [])

	useEffect(() => {
		const timer = setTimeout(
			() => setInitializationDelayElapsed(true),
			APP_INITIALIZATION_LOADING_DELAY_MS,
		)
		return () => clearTimeout(timer)
	}, [])

	const isUpdateCheckReady = state.status === 'ready'
	const isInitializationReady = isUpdateCheckReady && !isProfileLoading
	const showInitializationScreen = shouldShowAppInitializationLoading({
		delayElapsed: initializationDelayElapsed,
		isProfileLoading,
		isUpdateCheckReady,
	})

	useEffect(() => {
		const canRevealReactScreen =
			minDelayElapsed && (isInitializationReady || initializationDelayElapsed)

		if (!splashHidden && canRevealReactScreen) {
			SplashScreen.hide()
			setSplashHidden(true)
		}
	}, [initializationDelayElapsed, isInitializationReady, minDelayElapsed, splashHidden])

	const handleOpenStore = useCallback((storeUrl: string) => {
		Linking.openURL(storeUrl).catch(() => {})
	}, [])

	const noop = useCallback(() => {}, [])
	const handleEntryComplete = useCallback(() => setEntryComplete(true), [])

	const showUpdateModal = state.status === 'ready' && state.updateRequired

	return (
		<>
			{children}
			{!entryComplete && isInitializationReady && (
				<EntrySplashScreen
					active={splashHidden}
					onComplete={handleEntryComplete}
					onPresentationComplete={onEntryPresentationComplete}
				/>
			)}
			{showInitializationScreen && splashHidden && <AppInitializationScreen />}
			{showUpdateModal && (
				<AlertModal
					visible
					onClose={noop}
					title="업데이트가 필요해요"
					description={`최신 버전 (${state.minSupportedVersion})로 업데이트해 주세요!`}
					buttonLabel="확인"
					onButtonPress={() => handleOpenStore(state.storeUrl)}
					dismissOnBackdropPress={false}
				/>
			)}
		</>
	)
}

export default ForceUpdateGate
