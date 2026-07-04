import { useContext, useEffect, useState } from 'react'
import { serviceContext } from '@/shared/contexts/serviceContext'

export type ForceUpdateCheckState =
	| { status: 'checking' }
	| { status: 'ready'; updateRequired: false }
	| {
			status: 'ready'
			updateRequired: true
			minSupportedVersion: string
			storeUrl: string
	  }

const useForceUpdateCheck = (): ForceUpdateCheckState => {
	const { appVersionService } = useContext(serviceContext)
	const [state, setState] = useState<ForceUpdateCheckState>({ status: 'checking' })

	useEffect(() => {
		let cancelled = false

		const run = async () => {
			try {
				const result = await appVersionService.checkCurrentVersion()
				if (cancelled) return
				if (result.updateRequired) {
					setState({
						status: 'ready',
						updateRequired: true,
						minSupportedVersion: result.minSupportedVersion,
						storeUrl: result.storeUrl,
					})
				} else {
					setState({ status: 'ready', updateRequired: false })
				}
			} catch {
				// 네트워크/서버 장애 시 fail-open: 사용자가 앱을 사용할 수 있도록 통과시킨다.
				if (cancelled) return
				setState({ status: 'ready', updateRequired: false })
			}
		}

		run()

		return () => {
			cancelled = true
		}
	}, [appVersionService])

	return state
}

export default useForceUpdateCheck
