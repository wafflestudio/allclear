// allclear-app의 디자인 토큰 (src/shared/constants/colors.ts, category.ts와 동기화)
export const ClubColors = {
  BACKGROUND_MAIN: '#FAFAFA',
  BACKGROUND_SUB: '#F3F0F5',
  BODYTEXT_MAIN: '#202020',
  BODYTEXT_SUB: '#757474',
  BODYTEXT_SUB_2: '#BCBCBC',
  POINTCOLOR: '#874FFF',
  BUTTON_PUSH: '#4F2E94',
  DIVIDER: '#EAEAEA',
} as const

export type CategoryName =
  | '학술'
  | '종교'
  | '봉사'
  | '공연'
  | '운동'
  | '홍보'
  | '취미'
  | '문화'
  | '진로'

export type CategoryTheme = {
  themeColor: string
  backgroundColor: string
}

// 앱 CategoryMap과 동일한 순서 (홈 카테고리 그리드 배치 순서)
export const CLUB_CATEGORY_NAMES: CategoryName[] = [
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

export const CategoryThemeMap: Record<CategoryName, CategoryTheme> = {
  학술: { themeColor: '#2486FF', backgroundColor: '#E5EEFA' },
  종교: { themeColor: '#947C4F', backgroundColor: '#F7F6F3' },
  봉사: { themeColor: '#FF8F4A', backgroundColor: '#FAEFE8' },
  공연: { themeColor: '#B7CA2E', backgroundColor: '#F8FAEC' },
  운동: { themeColor: '#2A9D91', backgroundColor: '#EEF7F6' },
  홍보: { themeColor: '#E49E05', backgroundColor: '#FAF6EB' },
  취미: { themeColor: '#F05678', backgroundColor: '#F9EAED' },
  문화: { themeColor: '#739437', backgroundColor: '#F3F5F0' },
  진로: { themeColor: '#847876', backgroundColor: '#EEEDED' },
}

// 앱 홈 화면 카테고리 카드 아이콘 (allclear-app src/assets/icons/category/*)
export const CategoryIconMap: Record<CategoryName, string> = {
  학술: '/icons/category-home/academic.png',
  종교: '/icons/category-home/religion.png',
  봉사: '/icons/category-home/volunteer.png',
  공연: '/icons/category-home/performance.png',
  운동: '/icons/category-home/sports.png',
  홍보: '/icons/category-home/promotion.png',
  취미: '/icons/category-home/hobby.png',
  문화: '/icons/category-home/culture.png',
  진로: '/icons/category-home/career.png',
}

export function getCategoryTheme(category: string): CategoryTheme {
  return (
    CategoryThemeMap[category as CategoryName] ?? {
      themeColor: ClubColors.POINTCOLOR,
      backgroundColor: ClubColors.BACKGROUND_SUB,
    }
  )
}
