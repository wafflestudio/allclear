import { View } from 'react-native'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'

import { Colors } from '@/shared/constants/colors'
import { ms, s, vs } from '@/shared/utils/scale'

const ClubCardSkeleton = () => (
	<SkeletonPlaceholder backgroundColor={Colors.BACKGROUND_SUB} highlightColor={Colors.WHITE}>
		<SkeletonPlaceholder.Item flexDirection="row" height={s(90)}>
			<SkeletonPlaceholder.Item
				width={s(90)}
				height={s(90)}
				borderRadius={ms(8)}
				marginRight={s(15)}
			/>
			<SkeletonPlaceholder.Item flex={1} flexDirection="column">
				<SkeletonPlaceholder.Item flex={1}>
					<SkeletonPlaceholder.Item width={s(160)} height={vs(18)} borderRadius={ms(4)} />
					<SkeletonPlaceholder.Item
						width={'100%'}
						height={vs(32)}
						borderRadius={ms(4)}
						marginTop={vs(8)}
					/>
				</SkeletonPlaceholder.Item>
				<SkeletonPlaceholder.Item width={s(120)} height={vs(20)} borderRadius={ms(4)} />
			</SkeletonPlaceholder.Item>
		</SkeletonPlaceholder.Item>
	</SkeletonPlaceholder>
)

type Props = {
	count?: number
}

const ClubListSkeleton = ({ count = 6 }: Props) => (
	<View style={{ paddingVertical: vs(8), gap: vs(25) }}>
		{Array.from({ length: count }).map((_, i) => (
			<View key={i} style={{ paddingHorizontal: s(20) }}>
				<ClubCardSkeleton />
			</View>
		))}
	</View>
)

export default ClubListSkeleton
