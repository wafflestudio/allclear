import { useLoginBottomSheet } from '@/shared/contexts/loginBottomSheetContext'
import { useProfile } from '@/shared/contexts/profileContext'

const useRequireLogin = () => {
	const { user } = useProfile()
	const { openBottomSheet } = useLoginBottomSheet()

	return (action: () => void) => {
		if (!user) {
			openBottomSheet(action)
			return
		}
		action()
	}
}

export default useRequireLogin
