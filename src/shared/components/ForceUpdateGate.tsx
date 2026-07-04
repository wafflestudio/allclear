import React, { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import AlertModal from '@/shared/components/AlertModal'
import useForceUpdateCheck from '@/shared/hooks/useForceUpdateCheck'

const SPLASH_MIN_DURATION_MS = 1000

const ForceUpdateGate = ({ children }: { children: React.ReactNode }) => {
	const state = useForceUpdateCheck()
	const [minDelayElapsed, setMinDelayElapsed] = useState(false)
	const [splashHidden, setSplashHidden] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => setMinDelayElapsed(true), SPLASH_MIN_DURATION_MS)
		return () => clearTimeout(timer)
	}, [])

	useEffect(() => {
		if (!splashHidden && state.status === 'ready' && minDelayElapsed) {
			SplashScreen.hide()
			setSplashHidden(true)
		}
	}, [splashHidden, state.status, minDelayElapsed])

	const handleOpenStore = useCallback((storeUrl: string) => {
		Linking.openURL(storeUrl).catch(() => {})
	}, [])

	const noop = useCallback(() => {}, [])

	const showUpdateModal = state.status === 'ready' && state.updateRequired

	return (
		<>
			{children}
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
