import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'

import { Club } from '@/entities/club'
import HorizontalCarousel from '@/shared/components/HorizontalCarousel'
import { serviceContext } from '@/shared/contexts/serviceContext'

type Props = {
	openDetailPage: (club: Club) => void
}

const LatestClubsSection = ({ openDetailPage }: Props) => {
	const { data: latestClubs } = useLatestClubs()

	return <HorizontalCarousel clubs={latestClubs ?? []} onPressClub={openDetailPage} />
}

export default LatestClubsSection

const useLatestClubs = () => {
	const { clubService } = useContext(serviceContext)

	return useQuery({
		queryKey: ['clubs', 'latest'],
		queryFn: () => clubService.listLatestClubs(),
		keepPreviousData: true,
		select: data => data.clubs,
	})
}
