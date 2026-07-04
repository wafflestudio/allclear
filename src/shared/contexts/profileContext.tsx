import { User } from '@/entities/user'
import React, { createContext, useContext, useEffect } from 'react'
import { serviceContext } from '@/shared/contexts/serviceContext'

const profileContext = createContext<{
	user: User | null
	isLoading: boolean
	setUser: (user: User | null) => void
}>({
	user: null,
	isLoading: true,
	setUser: () => {},
})

export const useProfile = () => useContext(profileContext)

type Props = {
	children: React.ReactNode
}

export const ProfileProvider = ({ children }: Props) => {
	const { userService } = useContext(serviceContext)
	const [user, setUser] = React.useState<User | null>(null)
	const [isLoading, setIsLoading] = React.useState(true)

	useEffect(() => {
		const getUser = async () => {
			try {
				const u = await userService.getUser()
				setUser(u)
			} catch {
				setUser(null)
			} finally {
				setIsLoading(false)
			}
		}
		getUser()
	}, [userService])

	return (
		<profileContext.Provider value={{ user, isLoading, setUser }}>
			{children}
		</profileContext.Provider>
	)
}
