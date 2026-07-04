import AsyncStorage from '@react-native-async-storage/async-storage'

import { GUEST_ID } from '@/shared/constants/localStorage'

const generateUuidV4 = () =>
	'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
		const random = (Math.random() * 16) | 0
		const value = char === 'x' ? random : (random & 0x3) | 0x8
		return value.toString(16)
	})

let cachedGuestId: string | null = null
let pendingGuestId: Promise<string> | null = null

export const getOrCreateGuestId = async (): Promise<string> => {
	if (cachedGuestId) return cachedGuestId
	if (pendingGuestId) return pendingGuestId

	pendingGuestId = (async () => {
		const stored = await AsyncStorage.getItem(GUEST_ID)
		if (stored) {
			cachedGuestId = stored
			return stored
		}
		const fresh = generateUuidV4()
		await AsyncStorage.setItem(GUEST_ID, fresh)
		cachedGuestId = fresh
		return fresh
	})()

	try {
		return await pendingGuestId
	} finally {
		pendingGuestId = null
	}
}
