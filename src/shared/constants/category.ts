import { ImageSourcePropType } from 'react-native'
import { Category } from '@/entities/category'
import { Colors } from '@/shared/constants/colors'

export type CategoryDetail = {
	name: Category['name']
	themeColor: string
	backgroundColor: string
	icon: ImageSourcePropType
}

export const CLUB_CATEGORIES: Category['name'][] = [
	'학술',
	'종교',
	'봉사',
	'공연',
	'운동',
	'홍보',
	'취미',
	'문화',
	'진로',
]

export const CategoryMap: Record<Category['name'], CategoryDetail> = {
	학술: {
		name: '학술',
		themeColor: Colors.CATEGORY_ACADEMIC,
		backgroundColor: Colors.CATEGORY_BACKGROUND_ACADEMIC,
		icon: require('@/assets/icons/category/academic.png'),
	},
	종교: {
		name: '종교',
		themeColor: Colors.CATEGORY_RELIGION,
		backgroundColor: Colors.CATEGORY_BACKGROUND_RELIGION,
		icon: require('@/assets/icons/category/religion.png'),
	},
	봉사: {
		name: '봉사',
		themeColor: Colors.CATEGORY_VOLUNTEER,
		backgroundColor: Colors.CATEGORY_BACKGROUND_VOLUNTEER,
		icon: require('@/assets/icons/category/volunteer.png'),
	},
	공연: {
		name: '공연',
		themeColor: Colors.CATEGORY_PERFORMANCE,
		backgroundColor: Colors.CATEGORY_BACKGROUND_PERFORMANCE,
		icon: require('@/assets/icons/category/performance.png'),
	},
	운동: {
		name: '운동',
		themeColor: Colors.CATEGORY_SPORTS,
		backgroundColor: Colors.CATEGORY_BACKGROUND_WORKOUT,
		icon: require('@/assets/icons/category/sports.png'),
	},
	홍보: {
		name: '홍보',
		themeColor: Colors.CATEGORY_PROMOTION,
		backgroundColor: Colors.CATEGORY_BACKGROUND_PROMOTION,
		icon: require('@/assets/icons/category/promotion.png'),
	},
	취미: {
		name: '취미',
		themeColor: Colors.CATEGORY_HOBBY,
		backgroundColor: Colors.CATEGORY_BACKGROUND_HOBBY,
		icon: require('@/assets/icons/category/hobby.png'),
	},
	문화: {
		name: '문화',
		themeColor: Colors.CATEGORY_CULTURE,
		backgroundColor: Colors.CATEGORY_BACKGROUND_CULTURE,
		icon: require('@/assets/icons/category/culture.png'),
	},
	진로: {
		name: '진로',
		themeColor: Colors.CATEGORY_CAREER,
		backgroundColor: Colors.CATEGORY_BACKGROUND_CAREER,
		icon: require('@/assets/icons/category/career.png'),
	},
}
